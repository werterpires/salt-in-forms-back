import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CandidatesRepo } from './candidates.repo'
import { ExternalApiService } from '../shared/utils-module/external-api/external-api.service'
import { EncryptionService } from '../shared/utils-module/encryption/encryption.service'
import { CreateCandidate } from './types'
import { CustomLoggerService } from 'src/shared/utils-module/custom-logger/custom-logger.service'

@Injectable()
export class CandidatesService {
  constructor(
    private readonly candidatesRepo: CandidatesRepo,
    private readonly externalApiService: ExternalApiService,
    private readonly encryptionService: EncryptionService,
    private readonly loggger: CustomLoggerService
  ) {}

  @Cron('48 11 * * *')
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
      } catch (error) {
        this.loggger.error('Erro ao inserir candidatos em batch:', error.stack)
      }
    } else {
      this.loggger.info('\n=== Nenhum candidato encontrado para inserir ===')
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
}
