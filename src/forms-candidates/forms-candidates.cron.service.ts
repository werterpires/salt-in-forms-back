import { Injectable, OnModuleInit } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { FormsCandidatesRepo } from './forms-candidates.repo'
import { CustomLoggerService } from '../shared/utils-module/custom-logger/custom-logger.service'
import { SendPulseEmailService } from '../shared/utils-module/email-sender/sendpulse-email.service'
import { EncryptionService } from '../shared/utils-module/encryption/encryption.service'
import {
  ProcessInAnswerPeriod,
  SFormBasic,
  CreateFormCandidate,
  FormCandidateWithDetails,
  MinisterialFormCandidateContext,
  NormalFormCandidateContext
} from '../candidates/types'
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

@Injectable()
export class FormsCandidatesCronService implements OnModuleInit {
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
      '\n=== Iniciando cron: Processar candidatos no período de respostas ==='
    )

    const startTime = new Date()

    const processes: ProcessInAnswerPeriod[] =
      await this.formsCandidatesRepo.findProcessesInAnswerPeriod()

    this.logger.info(
      `\n=== Total de processos encontrados: ${processes.length} ===`
    )

    for (const process of processes) {
      // Buscar formulários do processo
      const sForms: SFormBasic[] =
        await this.formsCandidatesRepo.findSFormsByProcessId(process.processId)

      // Buscar candidatos que não estão na tabela FormsCandidates
      const candidatesNotInFormsCandidates: number[] =
        await this.formsCandidatesRepo.findCandidatesNotInFormsCandidatesByProcessId(
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
        const insertedIds: number[] =
          await this.formsCandidatesRepo.insertFormsCandidatesInBatch(
            formsCandidatesData
          )

        this.logger.info(
          `\n=== ${formsCandidatesData.length} códigos de acesso gerados ===`
        )

        // Enviar emails apenas para formulários do tipo "candidate"
        await this.sendEmailsForCandidateForms(insertedIds)
      }

      // Processar formulários ministeriais do processo
      await this.handleMinisterialForms(sForms)

      // Processar formulários normais do processo
      await this.handleNormalForms(sForms)
    }

    const endTime = new Date()
    const duration = (endTime.getTime() - startTime.getTime()) / 1000

    this.logger.info(
      `\n=== Finalizando cron: Processamento concluído em ${duration}s ===`
    )
  }

  /**
   * Envia emails para formulários do tipo "candidate"
   * Atualiza status para MAILED após envio bem-sucedido
   */
  private async sendEmailsForCandidateForms(formsCandidatesIds: number[]) {
    const frontendUrl = getFrontendUrl()

    // Buscar todos os dados de uma vez (query otimizada com JOIN)
    const formsCandidatesData: FormCandidateWithDetails[] =
      await this.formsCandidatesRepo.findCandidatesWithFormsCandidatesByIds(
        formsCandidatesIds
      )

    for (const formCandidateData of formsCandidatesData) {
      // Processar apenas formulários do tipo "candidate"
      if (formCandidateData.sFormType === 'candidate') {
        await this.sendCandidateFormEmail(
          formCandidateData.candidateName,
          formCandidateData.candidateEmail,
          formCandidateData.formCandidateAccessCode,
          frontendUrl
        )

        // Atualizar status para MAILED após envio bem-sucedido
        await this.formsCandidatesRepo.updateFormCandidateStatusByCandidateAndForm(
          formCandidateData.candidateId,
          formCandidateData.sFormId,
          FormCandidateStatus.MAILED
        )

        this.logger.info('Status atualizado para MAILED')
      }
      // Formulários "normal" e "ministerial" serão processados em outro cron
      // quando a tabela de respostas estiver disponível
    }
  }

  /**
   * Envia email para candidato do tipo "candidate"
   */
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
      this.logger.error(`Erro ao enviar email de primeiro acesso:`, error.stack)
    }
  }

  /**
   * Processa formulários ministeriais
   * Busca respostas, valida status, gera códigos e envia emails para ministeriais
   * Cada formCandidate é tratado independentemente (erros não bloqueiam o processamento)
   *
   * @param sForms - Formulários do processo
   */
  private async handleMinisterialForms(sForms: SFormBasic[]): Promise<void> {
    const frontendUrl = getFrontendUrl()

    // Filtrar apenas formulários ministeriais que têm emailQuestionId configurado
    const ministerialForms = sForms.filter(
      (form) => form.sFormType === 'ministerial' && form.emailQuestionId
    )

    if (ministerialForms.length === 0) {
      this.logger.info(
        'Nenhum formulário ministerial encontrado para processar'
      )
      return
    }

    this.logger.info(
      `Processando ${ministerialForms.length} formulário(s) ministerial(is)`
    )

    for (const sForm of ministerialForms) {
      try {
        // Buscar formCandidates ministeriais com contexto completo
        const ministerialFormCandidates: MinisterialFormCandidateContext[] =
          await this.formsCandidatesRepo.findMinisterialFormCandidatesWithContext(
            sForm.sFormId,
            sForm.emailQuestionId!
          )

        this.logger.info(
          `Formulário ministerial ${sForm.sFormId}: ${ministerialFormCandidates.length} formCandidate(s) encontrado(s)`
        )

        // Processar cada formCandidate individualmente
        for (const ministerialFC of ministerialFormCandidates) {
          await this.processMinisterialFormCandidate(ministerialFC, frontendUrl)
        }
      } catch (error) {
        this.logger.error(
          `Erro ao processar formulário ministerial ${sForm.sFormId}:`,
          error.stack
        )
      }
    }
  }

  /**
   * Processa um único formCandidate ministerial
   * Tratamento individual de erros para não bloquear outros processamentos
   *
   * @param ministerialFC - Contexto do formCandidate ministerial
   * @param frontendUrl - URL do frontend
   */
  private async processMinisterialFormCandidate(
    ministerialFC: MinisterialFormCandidateContext,
    frontendUrl: string
  ): Promise<void> {
    try {
      this.logger.info(
        `Processando formCandidate ministerial ${ministerialFC.formCandidateId} (candidato: ${ministerialFC.candidateId})`
      )

      // PASSO 1: Buscar a resposta da questão emailQuestionId em qualquer formCandidate do candidato
      const answer =
        await this.answersRepo.findAnswerByQuestionAndFormCandidate(
          ministerialFC.emailQuestionId,
          ministerialFC.candidateFormCandidateIds[0] // Buscar no primeiro formCandidate como referência
        )

      // Validação 1: Se não houver resposta, não faz nada
      if (!answer) {
        this.logger.info(
          `Nenhuma resposta encontrada para emailQuestionId ${ministerialFC.emailQuestionId}`
        )
        return
      }

      // Validação 2: Se validAnswer = false, marca como UNUSEFULL e passa para o próximo
      if (!answer.validAnswer) {
        this.logger.info(
          `Resposta inválida (validAnswer=false), marcando formCandidate ${ministerialFC.formCandidateId} como UNUSEFULL`
        )
        await this.formsCandidatesRepo.updateFormCandidateStatus(
          ministerialFC.formCandidateId,
          FormCandidateStatus.UNUSEFULL
        )
        return
      }

      // Validação 3: Se answerValue vazio ou nulo, não faz nada
      if (!answer.answerValue || answer.answerValue.trim() === '') {
        this.logger.info(
          `Resposta vazia ou nula, aguardando preenchimento para formCandidate ${ministerialFC.formCandidateId}`
        )
        return
      }

      // PASSO 2: Verificar se o formCandidate que contém a resposta está >= SUBMITTED
      const referencedFormCandidateStatus =
        await this.formsCandidatesRepo.findFormCandidateWithProcessDetails(
          answer.formCandidateId
        )

      if (
        !referencedFormCandidateStatus ||
        Number(referencedFormCandidateStatus.formCandidateStatus) < 5
      ) {
        this.logger.info(
          `FormCandidate referenciado ${answer.formCandidateId} ainda não foi submetido, aguardando`
        )
        return
      }

      // PASSO 3: Buscar ministerial pelo fieldName
      const fieldName = answer.answerValue.trim()
      const ministerial =
        await this.ministerialsRepo.findActiveMinisterialByFieldName(fieldName)

      // Validação 4: Se não encontrar ministerial ou não tiver nome/email, passa para o próximo
      if (!ministerial) {
        this.logger.warn(
          `Nenhum ministerial ativo encontrado para o campo "${fieldName}"`
        )
        return
      }

      if (
        !ministerial.ministerialName ||
        (!ministerial.ministerialPrimaryEmail &&
          !ministerial.ministerialAlternativeEmail)
      ) {
        this.logger.warn(
          `Ministerial ${ministerial.ministerialId} sem nome ou email válido`
        )
        return
      }

      // PASSO 4: Gerar novo código de acesso
      const newAccessCode = createAccessCode()
      await this.formsCandidatesRepo.updateAccessCode(
        ministerialFC.formCandidateId,
        newAccessCode
      )

      // PASSO 5: Enviar email para ministerial
      const ministerialEmail =
        ministerial.ministerialPrimaryEmail ||
        ministerial.ministerialAlternativeEmail

      const { name: candidateName } = decryptCandidateData(
        ministerialFC.candidateName,
        '', // Não precisamos do email aqui
        this.encryptionService
      )

      const accessLink = generateFormAccessLink(frontendUrl, newAccessCode)
      const html = getMinisterialFormAccessEmailTemplate(
        ministerial.ministerialName,
        candidateName,
        accessLink,
        newAccessCode
      )

      await this.sendPulseEmailService.sendEmail(
        ministerialEmail!,
        ministerial.ministerialName,
        html
      )

      // PASSO 6: Atualizar status para MAILED
      await this.formsCandidatesRepo.updateFormCandidateStatus(
        ministerialFC.formCandidateId,
        FormCandidateStatus.MAILED
      )

      this.logger.info(
        `Email ministerial enviado com sucesso para ${ministerial.ministerialName} (${ministerialEmail})`
      )
    } catch (error) {
      this.logger.error(
        `Erro ao processar formCandidate ministerial ${ministerialFC.formCandidateId}:`,
        error.stack
      )
    }
  }

  /**
   * Processa formulários do tipo "normal"
   * Busca respostas de email, valida status e envia emails
   * Cada formCandidate é tratado independentemente
   *
   * @param sForms - Formulários do processo
   */
  private async handleNormalForms(sForms: SFormBasic[]): Promise<void> {
    const frontendUrl = getFrontendUrl()

    // Filtrar apenas formulários normais que têm emailQuestionId configurado
    const normalForms = sForms.filter(
      (form) => form.sFormType === 'normal' && form.emailQuestionId
    )

    if (normalForms.length === 0) {
      this.logger.info('Nenhum formulário normal encontrado para processar')
      return
    }

    this.logger.info(
      `Processando ${normalForms.length} formulário(s) normal(is)`
    )

    for (const sForm of normalForms) {
      try {
        // Buscar formCandidates normais com contexto completo
        const normalFormCandidates: NormalFormCandidateContext[] =
          await this.formsCandidatesRepo.findNormalFormCandidatesWithContext(
            sForm.sFormId,
            sForm.emailQuestionId!
          )

        this.logger.info(
          `Formulário normal ${sForm.sFormId}: ${normalFormCandidates.length} formCandidate(s) encontrado(s)`
        )

        // Processar cada formCandidate individualmente
        for (const normalFC of normalFormCandidates) {
          await this.processNormalFormCandidate(normalFC, frontendUrl)
        }
      } catch (error) {
        this.logger.error(
          `Erro ao processar formulário normal ${sForm.sFormId}:`,
          error.stack
        )
      }
    }
  }

  /**
   * Processa um único formCandidate do tipo "normal"
   * Tratamento individual de erros para não bloquear outros processamentos
   *
   * @param normalFC - Contexto do formCandidate normal
   * @param frontendUrl - URL do frontend
   */
  private async processNormalFormCandidate(
    normalFC: NormalFormCandidateContext,
    frontendUrl: string
  ): Promise<void> {
    try {
      this.logger.info(
        `Processando formCandidate normal ${normalFC.formCandidateId} (candidato: ${normalFC.candidateId})`
      )

      // PASSO 1: Buscar a resposta da questão emailQuestionId em qualquer formCandidate do candidato
      const answer =
        await this.answersRepo.findAnswerByQuestionAndFormCandidate(
          normalFC.emailQuestionId,
          normalFC.candidateFormCandidateIds[0]
        )

      // Validação 1: Se não houver resposta, não faz nada
      if (!answer) {
        this.logger.info(
          `Nenhuma resposta encontrada para emailQuestionId ${normalFC.emailQuestionId}`
        )
        return
      }

      // Validação 2: Se validAnswer = false, marca como UNUSEFULL e passa para o próximo
      if (!answer.validAnswer) {
        this.logger.info(
          `Resposta inválida (validAnswer=false), marcando formCandidate ${normalFC.formCandidateId} como UNUSEFULL`
        )
        await this.formsCandidatesRepo.updateFormCandidateStatus(
          normalFC.formCandidateId,
          FormCandidateStatus.UNUSEFULL
        )
        return
      }

      // Validação 3: Se answerValue vazio ou nulo, não faz nada
      if (!answer.answerValue || answer.answerValue.trim() === '') {
        this.logger.info(
          `Resposta vazia ou nula, aguardando preenchimento para formCandidate ${normalFC.formCandidateId}`
        )
        return
      }

      // Validação 4: Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(answer.answerValue.trim())) {
        this.logger.warn(
          `Email inválido na resposta: "${answer.answerValue}", formCandidate ${normalFC.formCandidateId}`
        )
        return
      }

      // PASSO 2: Verificar se o formCandidate que contém a resposta está >= SUBMITTED
      const referencedFormCandidateStatus =
        await this.formsCandidatesRepo.findFormCandidateWithProcessDetails(
          answer.formCandidateId
        )

      if (
        !referencedFormCandidateStatus ||
        Number(referencedFormCandidateStatus.formCandidateStatus) < 5
      ) {
        this.logger.info(
          `FormCandidate referenciado ${answer.formCandidateId} ainda não foi submetido, aguardando`
        )
        return
      }

      // PASSO 3: O email já está no answerValue
      const recipientEmail = answer.answerValue.trim()

      // PASSO 4: Gerar novo código de acesso
      const newAccessCode = createAccessCode()
      await this.formsCandidatesRepo.updateAccessCode(
        normalFC.formCandidateId,
        newAccessCode
      )

      // PASSO 5: Enviar email
      const { name: candidateName } = decryptCandidateData(
        normalFC.candidateName,
        '',
        this.encryptionService
      )

      const accessLink = generateFormAccessLink(frontendUrl, newAccessCode)
      const html = getNormalFormAccessEmailTemplate(
        recipientEmail.split('@')[0], // Usar parte antes do @ como nome genérico
        candidateName,
        accessLink,
        newAccessCode
      )

      await this.sendPulseEmailService.sendEmail(
        recipientEmail,
        recipientEmail.split('@')[0],
        html
      )

      // PASSO 6: Atualizar status para MAILED
      await this.formsCandidatesRepo.updateFormCandidateStatus(
        normalFC.formCandidateId,
        FormCandidateStatus.MAILED
      )

      this.logger.info(
        `Email de formulário normal enviado com sucesso para ${recipientEmail}`
      )
    } catch (error) {
      this.logger.error(
        `Erro ao processar formCandidate normal ${normalFC.formCandidateId}:`,
        error.stack
      )
    }
  }
}
