import { Injectable, OnModuleInit } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { FormsCandidatesRepo } from './forms-candidates.repo'
import { CustomLoggerService } from '../shared/utils-module/custom-logger/custom-logger.service'
import { SendPulseEmailService } from '../shared/utils-module/email-sender/sendpulse-email.service'
import { EncryptionService } from '../shared/utils-module/encryption/encryption.service'
import { ProcessInAnswerPeriod, SFormBasic } from '../candidates/types'
import { FormCandidateStatus } from '../constants/form-candidate-status.const'
import {
  createAccessCode,
  getFrontendUrl,
  prepareCandidateEmailData,
  generateFormAccessLink,
  decryptCandidateData
} from './forms-candidates.helper'
import { getCandidateFormAccessEmailTemplate } from '../candidates/email-templates/candidate-form-access.template'
import { getMinisterialFormAccessEmailTemplate } from '../candidates/email-templates/ministerial-form-access.template'
import { getNormalFormAccessEmailTemplate } from '../candidates/email-templates/normal-form-access.template'
import { AnswersRepo } from '../answers/answers.repo'
import { MinisterialsRepo } from '../ministerials/ministerials.repo'
import { FormCandidateToSendEmail } from './types'
import {
  MinisterialWithRelations,
  MinisterialsFilter
} from '../ministerials/type'
import { Paginator } from '../shared/types/types'
import * as db from '../constants/db-schema.enum'

@Injectable()
export class FormsCandidatesCronService implements OnModuleInit {
  private ministerialsCache: Map<string, MinisterialWithRelations> | null = null

  constructor(
    private readonly formsCandidatesRepo: FormsCandidatesRepo,
    private readonly answersRepo: AnswersRepo,
    private readonly ministerialsRepo: MinisterialsRepo,
    private readonly logger: CustomLoggerService,
    private readonly sendPulseEmailService: SendPulseEmailService,
    private readonly encryptionService: EncryptionService,
    private readonly schedulerRegistry: SchedulerRegistry
  ) {}

  /**
   * Inicializa os crons dinâmicos baseados em variáveis de ambiente
   */
  onModuleInit() {
    this.registerDynamicCrons()
  }

  /**
   * Registra crons com frequências configuráveis via .env
   */
  private registerDynamicCrons() {
    // Cron de processamento de candidatos (a cada 30 minutos por padrão)
    const processCandidatesFrequency =
      process.env.PROCESS_CANDIDATES_CRON_FREQUENCY || '*/30 * * * *'

    const processCandidatesJob = new CronJob(
      processCandidatesFrequency,
      async () => {
        await this.handleProcessesInAnswerPeriod()
      }
    )

    this.schedulerRegistry.addCronJob(
      'handleProcessesInAnswerPeriod',
      processCandidatesJob
    )
    processCandidatesJob.start()

    this.logger.log(
      `Cron 'handleProcessesInAnswerPeriod' registrado com frequência: ${processCandidatesFrequency}`
    )
  }

  /**
   * Processa candidatos confirmados que estão no período de resposta
   * Gera códigos de acesso e envia emails para formulários do tipo "candidate"
   */
  async handleProcessesInAnswerPeriod() {
    this.logger.info(
      `\n====================================================================
       \n=== Iniciando cron: Processar candidatos no período de respostas ===
       \n====================================================================`
    )

    const frontendUrl = getFrontendUrl()

    const processes: ProcessInAnswerPeriod[] =
      await this.formsCandidatesRepo.findProcessesInAnswerPeriod()
    this.logger.info(
      `Foram encontrados ${processes.length} processo(s) no período de respostas com os seguintes IDs: ${processes.map((p) => p.processId).join(', ')}`
    )

    this.logger.info(
      `\n=== Total de processos encontrados: ${processes.length} ===`
    )

    const sForms: SFormBasic[] =
      await this.formsCandidatesRepo.findSFormsByProcessIds(
        processes.map((process) => process.processId)
      )

    this.logger.info(
      `Foram encontrados ${sForms.length} formulário(s) associado(s) aos processos no período de respostas`
    )

    const { normalFormsIds, ministerialFormsIds, candidatesFormsIds } =
      this.categorizeFormsByType(sForms)

    const invalidCandidatesFromGenerated =
      await this.processCandidateFormsCandidates(
        candidatesFormsIds,
        frontendUrl
      )

    const invalidCandidatesFromNonGenerated =
      await this.processNonCandidateFormsCandidates(
        ministerialFormsIds,
        normalFormsIds,
        frontendUrl
      )

    await this.markAsUnuseful([
      ...invalidCandidatesFromGenerated,
      ...invalidCandidatesFromNonGenerated
    ])

    // Limpar cache ao finalizar
    this.ministerialsCache = null

    return
  }

  /**
   * Categoriza formulários por tipo (normal, ministerial, candidate)
   */
  private categorizeFormsByType(sForms: SFormBasic[]): {
    normalFormsIds: number[]
    ministerialFormsIds: number[]
    candidatesFormsIds: number[]
  } {
    const normalFormsIds = sForms
      .filter((form) => form.sFormType === 'normal')
      .map((form) => form.sFormId)

    const ministerialFormsIds = sForms
      .filter((form) => form.sFormType === 'ministerial')
      .map((form) => form.sFormId)

    const candidatesFormsIds = sForms
      .filter((form) => form.sFormType === 'candidate')
      .map((form) => form.sFormId)

    this.logger.info(
      `Formulários do tipo "candidates": ${candidatesFormsIds.join(', ')}`
    )

    return { normalFormsIds, ministerialFormsIds, candidatesFormsIds }
  }

  /**
   * Processa formulários do tipo "candidate" no status GENERATED
   * Retorna a lista de formCandidates inválidos para marcação posterior
   */
  private async processCandidateFormsCandidates(
    candidatesFormsIds: number[],
    frontendUrl: string
  ): Promise<FormCandidateToSendEmail[]> {
    const formCandidatesInStatusGenerated =
      await this.formsCandidatesRepo.findFormsCandidatesInStatusGenerated()

    this.logger.info(
      `Foram encontrados ${formCandidatesInStatusGenerated.length} formulário(s) do tipo "candidate" no status GENERATED`
    )

    const invalidFormCandidates: FormCandidateToSendEmail[] = []

    for (const formCandidate of formCandidatesInStatusGenerated) {
      if (candidatesFormsIds.includes(formCandidate.sFormId)) {
        await this.sendCandidateFormEmail(
          formCandidate.candidateName,
          formCandidate.candidateEmail,
          formCandidate.formCandidateAccessCode,
          frontendUrl
        )

        await this.formsCandidatesRepo.updateFormCandidateStatusByCandidateAndForm(
          formCandidate.candidateId,
          formCandidate.sFormId,
          FormCandidateStatus.MAILED
        )
        this.logger.info(
          `Status atualizado para MAILED para formCandidateId: ${formCandidate.formCandidateId}`
        )
      } else {
        invalidFormCandidates.push(formCandidate)
      }
    }

    this.logger.info(
      `${invalidFormCandidates.length} formCandidate(s) marcado(s) como UNUSEFULL`
    )

    return invalidFormCandidates
  }

  /**
   * Processa formulários do tipo "ministerial" e "normal" que não estão no status GENERATED
   * Retorna a lista de formCandidates inválidos para marcação posterior
   */
  private async processNonCandidateFormsCandidates(
    ministerialFormsIds: number[],
    normalFormsIds: number[],
    frontendUrl: string
  ): Promise<FormCandidateToSendEmail[]> {
    const formCandidatesNotInStatusGenerated =
      await this.formsCandidatesRepo.findFormsNotCandidatesInStatusGenerated()

    // Carregar cache de ministeriais se ainda não foi carregado e há formulários para processar
    if (
      !this.ministerialsCache &&
      formCandidatesNotInStatusGenerated.length > 0
    ) {
      await this.loadMinisterialsCache()
    }

    const invalidFormCandidates: FormCandidateToSendEmail[] = []

    for (const formCandidate of formCandidatesNotInStatusGenerated) {
      if (ministerialFormsIds.includes(formCandidate.sFormId)) {
        await this.handleMinisterialForms(
          formCandidate.emailQuestionId,
          formCandidate.formCandidateId,
          frontendUrl,
          formCandidate.candidateName
        )
      } else if (normalFormsIds.includes(formCandidate.sFormId)) {
        await this.handleNormalForms(
          formCandidate.emailQuestionId,
          formCandidate.formCandidateId,
          frontendUrl,
          formCandidate.candidateName
        )
      } else {
        invalidFormCandidates.push(formCandidate)
        this.logger.warn(
          ` FormCandidateId ${formCandidate.formCandidateId} possui sFormId ${formCandidate.sFormId} que não corresponde a nenhum formulário do tipo "candidate", "ministerial" ou "normal" em tempo de inscrição`
        )
      }
    }

    return invalidFormCandidates
  }

  /**
   * Marca uma lista de formCandidates como UNUSEFULL
   */
  private async markAsUnuseful(
    formCandidates: FormCandidateToSendEmail[]
  ): Promise<void> {
    for (const formCandidate of formCandidates) {
      await this.formsCandidatesRepo.updateFormCandidateStatus(
        formCandidate.formCandidateId,
        FormCandidateStatus.UNUSEFULL
      )
    }
  }

  /**
   * Carrega todos os ministeriais ativos em cache usando paginação
   * Chave: fieldName (trimmed)
   * Valor: objeto completo MinisterialWithRelations
   */
  private async loadMinisterialsCache(): Promise<void> {
    this.logger.info('Carregando cache de ministeriais...')

    this.ministerialsCache = new Map()

    const filters: MinisterialsFilter = {
      ministerialActive: true
    }

    // Descobrir quantas páginas existem
    const totalPages =
      await this.ministerialsRepo.findMinisterialsQuantity(filters)

    this.logger.info(`Total de páginas a buscar: ${totalPages}`)

    // Buscar todas as páginas
    for (let page = 1; page <= totalPages; page++) {
      const paginator = new Paginator(
        page,
        'asc',
        db.Ministerials.MINISTERIAL_NAME,
        db.Ministerials.MINISTERIAL_NAME,
        db.Ministerials
      )

      const ministerials = await this.ministerialsRepo.findAllMinisterials(
        paginator,
        filters
      )

      for (const ministerial of ministerials) {
        const fieldKey = ministerial.fieldName.trim()
        this.ministerialsCache.set(fieldKey, ministerial)
      }

      this.logger.info(
        `Página ${page}/${totalPages} carregada (${ministerials.length} ministerial(is))`
      )
    }

    this.logger.info(
      `Cache finalizado com ${this.ministerialsCache.size} ministerial(is) ativo(s)`
    )
  }

  async handleMinisterialForms(
    emailQuestionId: number | null,
    formCandidateId: number,
    frontendUrl: string,
    candidateName: string
  ) {
    const answer = await this.getAnswerLinkValue(
      emailQuestionId,
      formCandidateId
    )

    if (!answer) {
      this.logger.info(
        `Nenhuma resposta encontrada para emailQuestionId ${emailQuestionId}`
      )
      return
    }

    //+++++++++++++ daqui pra cima tá igual

    const ministrialData = this.getMinisterialEmail(answer)

    if (!ministrialData) {
      return
    }

    const recipientEmail = ministrialData.email
    const ministerialName = ministrialData.name

    //+++++++++++++ lógica própria de pegar email

    await this.generateAndSendEmail(
      candidateName,
      frontendUrl,
      formCandidateId,
      recipientEmail,
      'candidate',
      ministerialName
    )
  }

  getMinisterialEmail(
    criptEmail: string
  ): { name: string; email: string } | null {
    // PASSO 3: Descriptografar o fieldName antes de buscar ministerial
    const decryptedFieldName = this.encryptionService.decrypt(criptEmail)

    // Buscar ministerial no cache
    const ministerial = this.ministerialsCache?.get(decryptedFieldName.trim()) //mudar

    // Validação 4: Se não encontrar ministerial ou não tiver nome/email, passa para o próximo
    if (!ministerial) {
      this.logger.warn(
        `Nenhum ministerial ativo encontrado para o campo "${decryptedFieldName}"`
      )
      return null
    }

    const ministerialEmail =
      ministerial.ministerialPrimaryEmail ||
      ministerial.ministerialAlternativeEmail

    const ministerialName = ministerial.ministerialName

    if (!ministerialName || !ministerialEmail) {
      this.logger.warn(
        `Ministerial ${ministerial.ministerialId} sem nome ou email válido`
      )
      return null
    }

    return { name: ministerialName, email: ministerialEmail }
  }

  async handleNormalForms(
    emailQuestionId: number | null,
    formCandidateId: number,
    frontendUrl: string,
    candidateName: string
  ) {
    const answer = await this.getAnswerLinkValue(
      emailQuestionId,
      formCandidateId
    )

    if (!answer) {
      this.logger.info(
        `Nenhuma resposta encontrada para emailQuestionId ${emailQuestionId}`
      )
      return
    }

    //+++++++++++++ daqui pra cima tá igual

    // PASSO 4: O email já está descriptografado
    const recipientEmail = this.encryptionService.decrypt(answer)

    //+++++++++++++ lógica própria de pegar email

    await this.generateAndSendEmail(
      candidateName,
      frontendUrl,
      formCandidateId,
      recipientEmail,
      'normal'
    )
  }

  async generateAndSendEmail(
    candidateName: string,
    frontendUrl: string,
    formCandidateId: number,
    recipientEmail: string,
    type: 'candidate' | 'normal',
    ministerialName?: string
  ) {
    const { name: decryptedCandidateName } = decryptCandidateData(
      candidateName,
      '',
      this.encryptionService
    )

    // PASSO 4: Gerar novo código de acesso
    const newAccessCode = createAccessCode()
    await this.formsCandidatesRepo.updateAccessCode(
      formCandidateId,
      newAccessCode
    )
    const accessLink = generateFormAccessLink(frontendUrl, newAccessCode)

    let html = ''
    if (type === 'normal') {
      html = getNormalFormAccessEmailTemplate(
        recipientEmail.split('@')[0], // Usar parte antes do @ como nome genérico
        decryptedCandidateName,
        accessLink,
        newAccessCode
      )
    } else if (type === 'candidate' && ministerialName) {
      html = getMinisterialFormAccessEmailTemplate(
        ministerialName,
        decryptedCandidateName,
        accessLink,
        newAccessCode
      )
    } else {
      this.logger.error(
        `Tipo de email inválido ou nome ministerial ausente para formCandidate ${formCandidateId}. tipo: ${type}, ministerialName: ${ministerialName}`
      )
    }

    await this.sendPulseEmailService.sendEmail(
      recipientEmail,
      ministerialName || recipientEmail.split('@')[0],
      html
    )

    // PASSO 6: Atualizar status para MAILED
    await this.formsCandidatesRepo.updateFormCandidateStatus(
      formCandidateId,
      FormCandidateStatus.MAILED
    )

    this.logger.info(
      `Email de formulário ${type} enviado com sucesso para ${recipientEmail}`
    )
  }

  async getAnswerLinkValue(
    emailQuestionId: number | null,
    formCandidateId: number
  ): Promise<string | null> {
    if (!emailQuestionId) {
      this.logger.info(
        'Nenhum emailQuestionId configurado para formulários ministeriais, pulando processamento'
      )
      return null
    }
    // PASSO 1: Buscar a resposta da questão emailQuestionId em qualquer formCandidate do candidato
    const answer =
      await this.answersRepo.findAnswerByQuestionAndFormCandidateSubmited(
        emailQuestionId,
        formCandidateId
      )

    // Validação 1: Se não houver resposta, não faz nada
    if (!answer) {
      this.logger.info(
        `Nenhuma resposta encontrada para emailQuestionId ${emailQuestionId}`
      )
      return null
    }

    // Validação 2: Se validAnswer = false, marca como UNUSEFULL e passa para o próximo
    if (!answer.validAnswer) {
      this.logger.info(
        `Resposta inválida (validAnswer=false), marcando formCandidate ${formCandidateId} como UNUSEFULL`
      )
      await this.formsCandidatesRepo.updateFormCandidateStatus(
        formCandidateId,
        FormCandidateStatus.UNUSEFULL
      )
      return null
    }

    // Validação 3: Se answerValue vazio ou nulo, não faz nada
    if (!answer.answerValue || answer.answerValue.trim() === '') {
      this.logger.info(
        `Resposta vazia ou nula, aguardando preenchimento para formCandidate ${formCandidateId}`
      )
      return null
    }

    return answer.answerValue.trim()
  }

  private async sendCandidateFormEmail(
    candidateName: string,
    candidateEmail: string,
    accessCode: string,
    frontendUrl: string
  ): Promise<void> {
    try {
      const { recipientName, recipientEmail, html } = prepareCandidateEmailData(
        candidateName,
        candidateEmail,
        accessCode,
        frontendUrl,
        this.encryptionService,
        getCandidateFormAccessEmailTemplate
      )

      await this.sendPulseEmailService.sendEmail(
        recipientEmail,
        recipientName,
        html
      )

      this.logger.info(
        `Email de primeiro acesso enviado para ${recipientName} (${recipientEmail})`
      )
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Erro ao enviar email de primeiro acesso para ${candidateEmail}: ${error.message}`,
          error.stack
        )
      }
    }
  }
}
