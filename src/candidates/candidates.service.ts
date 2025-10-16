import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CandidatesRepo } from './candidates.repo'
import { ExternalApiService } from '../shared/utils-module/external-api/external-api.service'
import { EncryptionService } from '../shared/utils-module/encryption/encryption.service'
import {
  CreateCandidate,
  CreateFormCandidate,
  ValidateAccessCodeResponse
} from './types'
import { CustomLoggerService } from 'src/shared/utils-module/custom-logger/custom-logger.service'
import { SendPulseEmailService } from '../shared/utils-module/email-sender/sendpulse-email.service'
import {
  createAccessCode,
  transformApiItemToCandidate,
  getHoursDifference,
  generateFormAccessLink
} from './candidates.helper'
import { FormCandidateStatus } from 'src/constants/form-candidate-status.const'
import { getCandidateFormAccessEmailTemplate } from './email-templates/candidate-form-access.template'
import { getImportSummaryEmailTemplate } from './email-templates/import-summary.template'

@Injectable()
export class CandidatesService {
  constructor(
    private readonly candidatesRepo: CandidatesRepo,
    private readonly externalApiService: ExternalApiService,
    private readonly encryptionService: EncryptionService,
    private readonly loggger: CustomLoggerService,
    private readonly sendPulseEmailService: SendPulseEmailService
  ) {}

  /**
   * Processa candidatos de processos que estão no período de respostas
   * Gera códigos de acesso e envia emails apenas para formulários do tipo "candidate"
   */
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

      // Buscar formulários do processo
      const sForms = await this.candidatesRepo.findSFormsByProcessId(
        process.processId
      )

      // Buscar candidatos que não estão na tabela FormsCandidates
      const candidatesNotInFormsCandidates =
        await this.candidatesRepo.findCandidatesNotInFormsCandidatesByProcessId(
          process.processId
        )

      if (candidatesNotInFormsCandidates.length > 0 && sForms.length > 0) {
        const formsCandidatesData: CreateFormCandidate[] = []

        // Gerar códigos de acesso para cada combinação candidato-formulário
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

        // Inserir FormsCandidates em batch e obter IDs gerados
        const insertedIds =
          await this.candidatesRepo.insertFormsCandidatesInBatch(
            formsCandidatesData
          )

        this.loggger.info(
          `\n=== ${formsCandidatesData.length} códigos de acesso gerados ===`
        )

        // Enviar emails apenas para formulários do tipo "candidate"
        await this.sendEmailsForCandidateForms(insertedIds)
      }
    }
  }

  /**
   * Cron que busca candidatos de processos em período de inscrição
   * Executa diariamente às 11:45
   */
  @Cron('40 15 * * *')
  async handleProcessInSubscriptionCron() {
    const processes = await this.candidatesRepo.findProcessInSubscription()

    const baseUrl = process.env.PROCESS_CANDIDATES_API

    if (!baseUrl) {
      this.loggger.error('#PROCESS_CANDIDATES_API não está definido no .env')
      return
    }

    const allCandidates: CreateCandidate[] = []

    // Buscar candidatos de cada processo
    for (const process of processes) {
      try {
        const apiUrl = `${baseUrl}${process.processTotvsId}`
        const response = await this.externalApiService.get(apiUrl)

        this.loggger.info(
          `Resposta da API para processo ${process.processTotvsId}:`,
          response.data
        )

        // Transformar dados da API em candidatos
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

    // Processar inserção dos candidatos
    if (allCandidates.length > 0) {
      await this.processCandidatesInsertion(allCandidates)
    } else {
      this.loggger.info('\n=== Nenhum candidato encontrado para inserir ===')
      await this.sendImportSummaryEmail(0, 0, 0)
    }

    // Processar candidatos no período de respostas
    await this.handleProcessesInAnswerPeriod()
  }

  /**
   * Cron para processar formulários do tipo "normal" e "ministerial"
   * TODO: Implementar quando a tabela de respostas estiver disponível
   *
   * Lógica necessária:
   * 1. Buscar candidatos que completaram formulário "candidate"
   * 2. Para formulários "normal": buscar resposta da pergunta vinculada (emailQuestionId)
   * 3. Enviar email para o endereço encontrado na resposta
   * 4. Para formulários "ministerial": implementar lógica específica
   */
  @Cron('0 */2 * * *') // A cada 2 horas
  handleNormalAndMinisterialForms() {
    this.loggger.info(
      '\n=== ATENÇÃO: Cron de formulários "normal" e "ministerial" não implementado ==='
    )
    this.loggger.info(
      'Motivo: Tabela de respostas das questions ainda não está disponível'
    )
    this.loggger.info('Quando implementar, este cron deve:')
    this.loggger.info(
      '1. Buscar candidatos que completaram o formulário "candidate"'
    )
    this.loggger.info(
      '2. Para formulários "normal": buscar resposta da pergunta vinculada (emailQuestionId)'
    )
    this.loggger.info('3. Enviar email para o endereço encontrado na resposta')
    this.loggger.info(
      '4. Para formulários "ministerial": implementar lógica específica'
    )
  }

  /**
   * Valida um código de acesso
   * Se expirado (>24h), gera novo código e reenvia email conforme tipo do formulário
   */
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
    const hoursDifference = getHoursDifference(createdAt, now)

    if (hoursDifference > 24) {
      const newAccessCode = createAccessCode()
      await this.candidatesRepo.updateAccessCode(
        formCandidate.formCandidateId,
        newAccessCode
      )

      // Buscar dados completos para reenvio de email
      await this.resendAccessCodeEmail(
        formCandidate.candidateId,
        formCandidate.sFormId,
        newAccessCode
      )

      throw new Error(
        '#O período de acesso expirou. Um novo código foi gerado e enviado por email.'
      )
    }

    return {
      message: 'Código válido',
      formCandidateId: formCandidate.formCandidateId
    }
  }

  /**
   * Reenvia email de acesso conforme tipo do formulário
   */
  private async resendAccessCodeEmail(
    candidateId: number,
    sFormId: number,
    accessCode: string
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL

    if (!frontendUrl) {
      this.loggger.error('#FRONTEND_URL não está definido no .env')
      return
    }

    // Buscar dados do candidato, formulário e tipo
    const formData =
      await this.candidatesRepo.findCandidateAndFormDataForResend(
        candidateId,
        sFormId
      )

    if (!formData) {
      this.loggger.error(
        `#Dados não encontrados para candidateId: ${candidateId}, sFormId: ${sFormId}`
      )
      return
    }

    const { sFormType, candidateName, candidateEmail } = formData

    if (sFormType === 'candidate') {
      try {
        // Descriptografar dados
        const decryptedName = this.encryptionService.decrypt(candidateName)
        const decryptedEmail = this.encryptionService.decrypt(candidateEmail)

        // Gerar link de acesso
        const accessLink = generateFormAccessLink(frontendUrl, accessCode)

        // Obter template de reenvio
        const html = this.getResendAccessCodeEmailTemplate(
          decryptedName,
          accessLink,
          accessCode
        )

        // Enviar email
        await this.sendPulseEmailService.sendEmail(
          decryptedEmail,
          decryptedName,
          html
        )

        this.loggger.info(
          `Email de reenvio enviado para ${decryptedName} (${decryptedEmail})`
        )
      } catch (error) {
        this.loggger.error(
          `Erro ao reenviar email para candidateId ${candidateId}:`,
          error.stack
        )
      }
    } else if (sFormType === 'normal' || sFormType === 'ministerial') {
      this.loggger.info(
        `\n=== ATENÇÃO: Reenvio de código para formulário tipo "${sFormType}" ainda não implementado ===`
      )
      this.loggger.info(
        'Quando implementar, buscar email da resposta da question vinculada (emailQuestionId)'
      )
    }
  }

  /**
   * Template de email para reenvio de código de acesso
   */
  private getResendAccessCodeEmailTemplate(
    candidateName: string,
    accessLink: string,
    accessCode: string
  ): string {
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Novo Código de Acesso</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                    🔄 Novo Código de Acesso
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #fef3c7; font-size: 16px;">
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
                    Seu código de acesso anterior expirou. Geramos um novo código para você acessar o formulário de inscrição.
                  </p>
                  
                  <!-- Access Button -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${accessLink}" style="display: inline-block; padding: 16px 32px; background-color: #f59e0b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Acessar Formulário
                    </a>
                  </div>
                  
                  <!-- Access Code Info -->
                  <div style="margin-top: 30px; padding: 20px; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px;">
                      <strong>Novo Código de Acesso:</strong>
                    </p>
                    <p style="margin: 0; color: #78350f; font-size: 18px; font-weight: 600; font-family: monospace;">
                      ${accessCode}
                    </p>
                  </div>
                  
                  <p style="margin: 30px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                    <strong>Importante:</strong> Este novo código também é válido por 24 horas.
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
  }

  /**
   * Processa a inserção de candidatos verificando duplicatas
   * Envia email com resumo do processo
   */
  private async processCandidatesInsertion(allCandidates: CreateCandidate[]) {
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
        const uniqueDocuments = candidates.map((c) => c.candidateUniqueDocument)
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

      // Inserir novos candidatos
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
  }

  /**
   * Envia email com resumo da importação de candidatos
   */
  private async sendImportSummaryEmail(
    totalFound: number,
    totalDuplicated: number,
    totalInserted: number
  ) {
    try {
      const html = getImportSummaryEmailTemplate(
        totalFound,
        totalDuplicated,
        totalInserted
      )

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

  /**
   * Converte resposta da API em array de candidatos
   * Utiliza helper para transformação
   */
  private parseApiResponseToCandidates(
    apiData: any[],
    processId: number
  ): CreateCandidate[] {
    const candidates: CreateCandidate[] = []

    for (const item of apiData) {
      const candidate = transformApiItemToCandidate(
        item,
        processId,
        this.encryptionService
      )

      if (candidate) {
        candidates.push(candidate)
      }
    }

    return candidates
  }

  /**
   * Envia emails apenas para formulários do tipo "candidate"
   * Otimizado com uma única query para buscar todos os dados necessários
   */
  private async sendEmailsForCandidateForms(formsCandidatesIds: number[]) {
    const frontendUrl = process.env.FRONTEND_URL

    if (!frontendUrl) {
      this.loggger.error('#FRONTEND_URL não está definido no .env')
      return
    }

    // Buscar todos os dados de uma vez (query otimizada com JOIN)
    const formsCandidatesData =
      await this.candidatesRepo.findCandidatesWithFormsCandidatesByIds(
        formsCandidatesIds
      )

    for (const formCandidateData of formsCandidatesData) {
      try {
        // Processar apenas formulários do tipo "candidate"
        if (formCandidateData.sFormType === 'candidate') {
          // Descriptografar dados sensíveis
          const candidateName = this.encryptionService.decrypt(
            formCandidateData.candidateName
          )
          const candidateEmail = this.encryptionService.decrypt(
            formCandidateData.candidateEmail
          )

          // Gerar link de acesso
          const accessLink = generateFormAccessLink(
            frontendUrl,
            formCandidateData.formCandidateAccessCode
          )

          // Obter template de email
          const html = getCandidateFormAccessEmailTemplate(
            candidateName,
            accessLink,
            formCandidateData.formCandidateAccessCode
          )

          // Enviar email
          await this.sendPulseEmailService.sendEmail(
            candidateEmail,
            candidateName,
            html
          )

          // Atualizar status para MAILED após envio bem-sucedido
          await this.candidatesRepo.updateFormCandidateStatus(
            formCandidateData.candidateId,
            formCandidateData.sFormId,
            FormCandidateStatus.MAILED
          )

          this.loggger.info(
            `Email enviado para ${candidateName} (${candidateEmail}) - Status atualizado para MAILED`
          )
        }
        // Formulários "normal" e "ministerial" serão processados em outro cron
        // quando a tabela de respostas estiver disponível
      } catch (error) {
        this.loggger.error(
          `Erro ao enviar email para formCandidate ${formCandidateData.candidateId}:`,
          error.stack
        )
      }
    }
  }
}
