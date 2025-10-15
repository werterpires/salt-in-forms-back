import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CandidatesRepo } from './candidates.repo'
import { ExternalApiService } from '../shared/utils-module/external-api/external-api.service'
import { EncryptionService } from '../shared/utils-module/encryption/encryption.service'
import {
  CreateCandidate,
  CreateFormCandidate,
  ValidateAccessCodeResponse,
  AccessCodeMapEntry
} from './types'
import { CustomLoggerService } from 'src/shared/utils-module/custom-logger/custom-logger.service'
import { SendPulseEmailService } from '../shared/utils-module/email-sender/sendpulse-email.service'
import { createAccessCode } from './candidates.helper'
import { FormCandidateStatus } from 'src/constants/form-candidate-status.const'

@Injectable()
export class CandidatesService {
  private accessCodeMap: Map<string, AccessCodeMapEntry> = new Map()

  constructor(
    private readonly candidatesRepo: CandidatesRepo,
    private readonly externalApiService: ExternalApiService,
    private readonly encryptionService: EncryptionService,
    private readonly loggger: CustomLoggerService,
    private readonly sendPulseEmailService: SendPulseEmailService
  ) {}

  async handleProcessesInAnswerPeriod() {
    this.loggger.info(
      '\n=== Executando cron: Buscar processos no período de respostas ==='
    )

    const processes = await this.candidatesRepo.findProcessesInAnswerPeriod()

    this.loggger.info(
      `\n=== Total de processos encontrados: ${processes.length} ===`
    )

    for (const process of processes) {
      console.log(process)

      const sForms = await this.candidatesRepo.findSFormsByProcessId(
        process.processId
      )
      console.log(sForms)

      // Buscar candidatos que não estão na tabela FormsCandidates
      const candidatesNotInFormsCandidates =
        await this.candidatesRepo.findCandidatesNotInFormsCandidatesByProcessId(
          process.processId
        )

      if (candidatesNotInFormsCandidates.length > 0 && sForms.length > 0) {
        const formsCandidatesData: CreateFormCandidate[] = []

        for (const candidateId of candidatesNotInFormsCandidates) {
          for (const sForm of sForms) {
            formsCandidatesData.push({
              candidateId: candidateId,
              sFormId: sForm.sFormId,
              formCandidateStatus: FormCandidateStatus.GENERATED,
              formCandidateAccessCode: createAccessCode()
            })
          }
        }

        await this.candidatesRepo.insertFormsCandidatesInBatch(
          formsCandidatesData
        )

        // Armazenar códigos de acesso em memória
        for (const formCandidate of formsCandidatesData) {
          this.accessCodeMap.set(formCandidate.formCandidateAccessCode, {
            candidateId: formCandidate.candidateId,
            sFormId: formCandidate.sFormId
          })
        }

        this.loggger.info(
          `\n=== ${formsCandidatesData.length} códigos de acesso armazenados em memória ===`
        )

        // Enviar emails para os novos candidatos
        await this.sendEmailsToNewFormsCandidates(formsCandidatesData, sForms)
      }
    }
  }

  @Cron('45 11 * * *')
  async handleProcessInSubscriptionCron() {
    const processes = await this.candidatesRepo.findProcessInSubscription()

    const baseUrl = process.env.PROCESS_CANDIDATES_API

    if (!baseUrl) {
      this.loggger.error('#PROCESS_CANDIDATES_API não está definido no .env')
      return
    }

    const allCandidates: CreateCandidate[] = []

    for (const process of processes) {
      try {
        const apiUrl = `${baseUrl}${process.processTotvsId}`

        const response = await this.externalApiService.get(apiUrl)

        this.loggger.info(
          `Resposta da API para processo ${process.processTotvsId}:`,
          response.data
        )

        // Parse e criar candidatos
        const candidates = this.parseApiResponseToCandidates(
          response.data,
          process.processId
        )

        this.loggger.info(
          `\n=== Candidatos coletados para processo ${process.processTitle} ===`
        )

        allCandidates.push(...candidates)
      } catch (error) {
        this.loggger.error(
          `Erro ao buscar candidatos do processo ${process.processTotvsId}:`,
          error.stack
        )
      }
    }

    // Inserir todos os candidatos de uma única vez em uma transação
    if (allCandidates.length > 0) {
      try {
        // Agrupar candidatos por processo para verificar duplicatas
        const candidatesByProcess = new Map<number, CreateCandidate[]>()
        allCandidates.forEach((candidate) => {
          if (!candidatesByProcess.has(candidate.processId)) {
            candidatesByProcess.set(candidate.processId, [])
          }
          candidatesByProcess.get(candidate.processId)!.push(candidate)
        })

        const candidatesToInsert: CreateCandidate[] = []
        let duplicatesCount = 0

        // Verificar duplicatas para cada processo
        for (const [processId, candidates] of candidatesByProcess) {
          const uniqueDocuments = candidates.map(
            (c) => c.candidateUniqueDocument
          )
          const existingDocuments =
            await this.candidatesRepo.findExistingCandidatesByProcessAndDocument(
              processId,
              uniqueDocuments
            )

          // Filtrar apenas os candidatos que não existem
          const newCandidates = candidates.filter(
            (candidate) =>
              !existingDocuments.includes(candidate.candidateUniqueDocument)
          )

          duplicatesCount += candidates.length - newCandidates.length
          candidatesToInsert.push(...newCandidates)
        }

        if (candidatesToInsert.length > 0) {
          await this.candidatesRepo.insertCandidatesInBatch(candidatesToInsert)
          this.loggger.info(
            `\n=== Total de ${candidatesToInsert.length} candidatos inseridos com sucesso ===`
          )
        }

        if (duplicatesCount > 0) {
          this.loggger.info(
            `\n=== ${duplicatesCount} candidatos duplicados foram ignorados ===`
          )
        }

        // Enviar email com resumo
        await this.sendImportSummaryEmail(
          allCandidates.length,
          duplicatesCount,
          candidatesToInsert.length
        )
      } catch (error) {
        this.loggger.error('Erro ao inserir candidatos em batch:', error.stack)
      }
    } else {
      this.loggger.info('\n=== Nenhum candidato encontrado para inserir ===')

      // Enviar email mesmo quando não houver candidatos
      await this.sendImportSummaryEmail(0, 0, 0)
    }

    await this.handleProcessesInAnswerPeriod()
  }

  private async sendImportSummaryEmail(
    totalFound: number,
    totalDuplicated: number,
    totalInserted: number
  ) {
    try {
      const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Relatório de Importação de Candidatos</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                        📊 Relatório de Importação
                      </h1>
                      <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                        Processamento de Candidatos
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                        Olá! O processo de importação de candidatos foi concluído. Aqui está o resumo:
                      </p>
                      
                      <!-- Statistics Cards -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px;">
                              <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px; font-weight: 500;">
                                Total Encontrado
                              </p>
                              <p style="margin: 0; color: #1e40af; font-size: 32px; font-weight: 700;">
                                ${totalFound}
                              </p>
                            </div>
                          </td>
                        </tr>
                        
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 6px;">
                              <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px; font-weight: 500;">
                                Duplicados (Descartados)
                              </p>
                              <p style="margin: 0; color: #d97706; font-size: 32px; font-weight: 700;">
                                ${totalDuplicated}
                              </p>
                            </div>
                          </td>
                        </tr>
                        
                        <tr>
                          <td>
                            <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; border-radius: 6px;">
                              <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px; font-weight: 500;">
                                Inseridos com Sucesso
                              </p>
                              <p style="margin: 0; color: #059669; font-size: 32px; font-weight: 700;">
                                ${totalInserted}
                              </p>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Summary -->
                      <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
                        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                          <strong>Resumo:</strong> De ${totalFound} candidatos encontrados, ${totalDuplicated} ${totalDuplicated === 1 ? 'foi descartado' : 'foram descartados'} por duplicidade e ${totalInserted} ${totalInserted === 1 ? 'foi inserido' : 'foram inseridos'} no sistema.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; color: #94a3b8; font-size: 14px;">
                        Este é um email automático do sistema de importação de candidatos
                      </p>
                      <p style="margin: 10px 0 0 0; color: #cbd5e1; font-size: 12px;">
                        Data: ${new Date().toLocaleString('pt-BR')}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `

      await this.sendPulseEmailService.sendEmail(
        'werterpires23@hotmail.com',
        'Werter Pires',
        html
      )

      this.loggger.info('Email de resumo enviado com sucesso')
    } catch (error) {
      this.loggger.error('Erro ao enviar email de resumo:', error.stack)
    }
  }

  private parseApiResponseToCandidates(apiData: any[], processId: number) {
    const candidates: CreateCandidate[] = []

    for (const item of apiData) {
      try {
        const attributes = JSON.parse(item.attributes)

        // Mapeamento dos campos
        const fieldMap = {}
        attributes.forEach((attr) => {
          const label = attr.Label.toLowerCase()
          const value =
            attr.Values && attr.Values.length > 0 ? attr.Values[0].Caption : ''
          fieldMap[label] = value
        })

        // Determinar se é estrangeiro
        const estrangeiroValue =
          fieldMap['estrangeiro ?'] || fieldMap['estrangeiro']
        const isForeigner = estrangeiroValue === 'Sim'

        const candidate: CreateCandidate = {
          processId: processId,
          candidateName: this.encryptionService.encrypt(
            fieldMap['nome completo'] || fieldMap['nome'] || ''
          ),
          candidateUniqueDocument: isForeigner
            ? fieldMap['n° passaporte'] || fieldMap['passaporte'] || ''
            : fieldMap['cpf'] || '',
          candidateEmail: this.encryptionService.encrypt(
            fieldMap['e-mail'] || fieldMap['email'] || ''
          ),
          candidatePhone: this.encryptionService.encrypt(
            fieldMap['telefone'] || fieldMap['phone'] || ''
          ),
          candidateBirthdate: this.encryptionService.encrypt(
            this.formatDate(
              fieldMap['data de nascimento'] || fieldMap['nascimento'] || ''
            )
          ),
          candidateForeigner: isForeigner,
          candidateAddress: this.encryptionService.encrypt(
            fieldMap['endereço'] || fieldMap['endereco'] || ''
          ),
          candidateAddressNumber: this.encryptionService.encrypt(
            fieldMap['número'] || fieldMap['numero'] || ''
          ),
          candidateDistrict: this.encryptionService.encrypt(
            fieldMap['bairro'] || ''
          ),
          candidateCity: this.encryptionService.encrypt(
            fieldMap['cidade'] || ''
          ),
          candidateState: this.encryptionService.encrypt(
            fieldMap['estado'] || ''
          ),
          candidateZipCode: this.encryptionService.encrypt(
            fieldMap['cep'] || ''
          ),
          candidateCountry: this.encryptionService.encrypt('')
        }

        candidates.push(candidate)
      } catch (error) {
        console.error('Erro ao processar item da API:', error.message, item)
      }
    }

    return candidates
  }

  private formatDate(dateString: string): string {
    if (!dateString) return ''

    // Se já está no formato YYYY-MM-DD, retorna
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }

    // Se está no formato DD/MM/YYYY, converte
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/')
      return `${year}-${month}-${day}`
    }

    return dateString
  }

  async validateAccessCode(
    accessCode: string
  ): Promise<ValidateAccessCodeResponse> {
    const formCandidate =
      await this.candidatesRepo.findFormCandidateByAccessCode(accessCode)

    if (!formCandidate) {
      throw new Error('#Código de acesso não encontrado.')
    }

    const createdAt = new Date(formCandidate.created_at)
    const now = new Date()
    const hoursDifference =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

    if (hoursDifference > 24) {
      const newAccessCode = createAccessCode()
      await this.candidatesRepo.updateAccessCode(
        formCandidate.formCandidateId,
        newAccessCode
      )

      // Remover código antigo e adicionar novo código em memória
      this.accessCodeMap.delete(accessCode)
      this.accessCodeMap.set(newAccessCode, {
        candidateId: formCandidate.candidateId,
        sFormId: formCandidate.sFormId
      })

      throw new Error(
        '#O período de acesso expirou. Um novo código foi gerado.'
      )
    }

    return {
      message: 'Código válido',
      formCandidateId: formCandidate.formCandidateId
    }
  }

  private async sendEmailsToNewFormsCandidates(
    formsCandidatesData: CreateFormCandidate[],
    sForms: any[]
  ) {
    const frontendUrl = process.env.FRONTEND_URL

    if (!frontendUrl) {
      this.loggger.error('#FRONTEND_URL não está definido no .env')
      return
    }

    for (const formCandidate of formsCandidatesData) {
      try {
        // Buscar o tipo do formulário
        const sForm = sForms.find((f) => f.sFormId === formCandidate.sFormId)

        if (!sForm) {
          this.loggger.warn(
            `Formulário ${formCandidate.sFormId} não encontrado`
          )
          continue
        }

        if (sForm.sFormType === 'candidate') {
          // Buscar dados do candidato
          const candidate = await this.candidatesRepo.findCandidateById(
            formCandidate.candidateId
          )

          if (!candidate) {
            this.loggger.warn(
              `Candidato ${formCandidate.candidateId} não encontrado`
            )
            continue
          }

          // Descriptografar nome e email
          const candidateName = this.encryptionService.decrypt(
            candidate.candidateName
          )
          const candidateEmail = this.encryptionService.decrypt(
            candidate.candidateEmail
          )

          // Gerar link de acesso
          const accessLink = `${frontendUrl}/formulario/${formCandidate.formCandidateAccessCode}`

          // Criar HTML do email
          const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Acesso ao Formulário de Inscrição</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                            📝 Formulário de Inscrição
                          </h1>
                          <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                            Vestibular FAAMA
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                            Olá, <strong>${candidateName}</strong>!
                          </p>
                          
                          <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                            Você está recebendo este e-mail para acessar o formulário de inscrição do vestibular do FAAMA. 
                            Por favor, clique no botão abaixo para preencher seu formulário.
                          </p>
                          
                          <!-- Access Button -->
                          <div style="text-align: center; margin: 40px 0;">
                            <a href="${accessLink}" style="display: inline-block; padding: 16px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                              Acessar Formulário
                            </a>
                          </div>
                          
                          <!-- Access Code Info -->
                          <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #667eea;">
                            <p style="margin: 0 0 10px 0; color: #475569; font-size: 14px;">
                              <strong>Código de Acesso:</strong>
                            </p>
                            <p style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 600; font-family: monospace;">
                              ${formCandidate.formCandidateAccessCode}
                            </p>
                          </div>
                          
                          <p style="margin: 30px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                            <strong>Importante:</strong> Este código de acesso é válido por 24 horas. 
                            Caso expire, um novo código será gerado automaticamente.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                          <p style="margin: 0; color: #94a3b8; font-size: 14px;">
                            Este é um email automático do sistema de inscrições FAAMA
                          </p>
                          <p style="margin: 10px 0 0 0; color: #cbd5e1; font-size: 12px;">
                            Data: ${new Date().toLocaleString('pt-BR')}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `

          // Enviar email
          await this.sendPulseEmailService.sendEmail(
            candidateEmail,
            candidateName,
            html
          )

          this.loggger.info(
            `Email enviado para ${candidateName} (${candidateEmail})`
          )
        } else if (
          sForm.sFormType === 'ministerial' ||
          sForm.sFormType === 'normal'
        ) {
          console.log('tem que implementar o envio para ministeriais e normais')
        }
      } catch (error) {
        this.loggger.error(
          `Erro ao enviar email para formCandidate ${formCandidate.candidateId}:`,
          error.stack
        )
      }
    }
  }
}
