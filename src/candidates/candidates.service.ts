import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common'
import { Cron, SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { CandidatesRepo } from './candidates.repo'
import { ExternalApiService } from '../shared/utils-module/external-api/external-api.service'
import { EncryptionService } from '../shared/utils-module/encryption/encryption.service'
import {
  CreateFormCandidate,
  FormToAnswer,
  SectionToAnswer,
  QuestionToAnswer,
  SubQuestionToAnswer,
  ProcessInAnswerPeriod,
  SFormBasic,
  FormCandidateWithDetails
} from './types'
import { CustomLoggerService } from 'src/shared/utils-module/custom-logger/custom-logger.service'
import { SendPulseEmailService } from '../shared/utils-module/email-sender/sendpulse-email.service'
import {
  createAccessCode,
  prepareCandidateEmailData,
  getFrontendUrl,
  decryptAnswer
} from './candidates.helper'
import { FormCandidateStatus } from 'src/constants/form-candidate-status.const'
import { getCandidateFormAccessEmailTemplate } from './email-templates/candidate-form-access.template'
import { Term } from 'src/terms/types'
import { FormsCandidatesService } from 'src/forms-candidates/forms-candidates.service'
import { AnswerWithoutId } from 'src/answers/types'
import { SignTermsDto } from './dto/sign-terms.dto'
import { SelfRegisterCandidateDto } from './dto/self-register-candidate.dto'
import { PendingCandidatesService } from './pending-candidates.service'
import { ExternalOrderValidationService } from './external-order-validation.service'
import { getConfirmationEmailTemplate } from './email-templates/confirmation-email.template'
import { getRegistrationConfirmedTemplate } from './email-templates/registration-confirmed.template'

@Injectable()
export class CandidatesService implements OnModuleInit {
  constructor(
    private readonly candidatesRepo: CandidatesRepo,
    private readonly externalApiService: ExternalApiService,
    private readonly encryptionService: EncryptionService,
    private readonly loggger: CustomLoggerService,
    private readonly sendPulseEmailService: SendPulseEmailService,
    private readonly formsCandidatesService: FormsCandidatesService,
    private readonly pendingCandidatesService: PendingCandidatesService,
    private readonly externalOrderValidationService: ExternalOrderValidationService,
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

    this.loggger.log(
      `Cron 'handleProcessesInAnswerPeriod' registrado com frequência: ${processCandidatesFrequency}`
    )
  }

  /**
   * Auto-cadastro de candidato com validação de orderCode
   *
   * Fluxo:
   * a) Verificar se orderCode já foi usado em Candidates (confirmados)
   * b) Verificar se candidato já existe no processo (por documento)
   * c) Buscar processo e validar processDataKey
   * d) Validar orderCode na API externa
   * e) Verificar se existe pending não confirmado com este orderCode
   *    - Se existe E email é diferente: invalidar token antigo, criar novo
   *    - Se existe E email é igual: apenas reenviar email com mesmo token
   * f) Gerar token de confirmação único (UUID ou similar)
   * g) Calcular data de expiração (now + CONFIRMATION_TOKEN_EXPIRATION)
   * h) Criptografar dados sensíveis (email, documento, telefone)
   * i) Inserir em PendingCandidates
   * j) Enviar email de confirmação
   *
   * @param dto Dados do candidato para auto-cadastro
   * @returns Mensagem de sucesso
   */
  async selfRegisterCandidate(
    dto: SelfRegisterCandidateDto
  ): Promise<{ message: string }> {
    this.loggger.log(
      `Iniciando auto-cadastro para orderCode: ${dto.orderCode}, processo: ${dto.processId}`
    )

    // a) Verificar se orderCode já foi usado em Candidates (confirmados)
    const orderCodeUsed = await this.candidatesRepo.isOrderCodeInCandidates(
      dto.orderCode
    )
    if (orderCodeUsed) {
      this.loggger.warn(
        `OrderCode ${dto.orderCode} já foi utilizado por um candidato confirmado`
      )
      throw new BadRequestException(
        '#Este código de pedido já foi utilizado. Entre em contato com o suporte se acredita que isso é um erro.'
      )
    }

    // b) Verificar se candidato já existe no processo (por documento literal)
    // IMPORTANTE: O documento NÃO é criptografado, mantém-se literal para buscas
    const candidateExists = await this.candidatesRepo.candidateExistsInProcess(
      dto.processId,
      dto.candidateUniqueDocument
    )
    if (candidateExists) {
      this.loggger.warn(
        `Candidato com documento já existe no processo ${dto.processId}`
      )
      throw new BadRequestException(
        '#Você já está cadastrado neste processo seletivo.'
      )
    }

    // c) Buscar processo e validar processDataKey
    const process = await this.candidatesRepo.findProcessById(dto.processId)
    if (!process) {
      this.loggger.error(`Processo ${dto.processId} não encontrado`)
      throw new BadRequestException('#Processo seletivo não encontrado.')
    }

    if (!process.processDataKey) {
      this.loggger.error(
        `Processo ${dto.processId} não possui processDataKey configurado`
      )
      throw new BadRequestException(
        '#Processo seletivo não está configurado corretamente.'
      )
    }

    // d) Validar orderCode na API externa
    this.loggger.log(
      `Validando orderCode ${dto.orderCode} na API externa com dataKey: ${process.processDataKey}`
    )
    const validationResult =
      await this.externalOrderValidationService.validateOrderCode(
        dto.orderCode,
        process.processDataKey
      )

    if (!validationResult.isValid) {
      this.loggger.warn(
        `OrderCode ${dto.orderCode} inválido: ${validationResult.message}`
      )
      throw new BadRequestException(validationResult.message)
    }

    this.loggger.log(`OrderCode ${dto.orderCode} validado com sucesso`)

    // e) Verificar se existe pending não confirmado com este orderCode
    const existingPending =
      await this.pendingCandidatesService.findPendingByOrderCode(dto.orderCode)

    // Criptografar dados sensíveis (nome, email e telefone)
    // IMPORTANTE: Documento NÃO é criptografado (necessário para buscas)
    const encryptedName = this.encryptionService.encrypt(dto.candidateName)
    const encryptedEmail = this.encryptionService.encrypt(dto.candidateEmail)
    const encryptedPhone = this.encryptionService.encrypt(dto.candidatePhone)

    let confirmationToken: string

    if (existingPending) {
      this.loggger.log(
        `Encontrado pending existente para orderCode ${dto.orderCode}`
      )

      // Se o email é diferente, criar novo pending (o service já invalida o anterior)
      if (existingPending.candidateEmail !== encryptedEmail) {
        this.loggger.log('Email diferente detectado, criando novo pending')

        const result =
          await this.pendingCandidatesService.createOrUpdatePendingCandidate(
            {
              candidateName: encryptedName,
              candidateEmail: encryptedEmail,
              candidateDocumentType: dto.candidateDocumentType,
              candidateUniqueDocument: dto.candidateUniqueDocument,
              candidatePhone: encryptedPhone,
              orderCode: dto.orderCode,
              processId: dto.processId
            },
            dto.orderCode
          )

        confirmationToken = result.confirmationToken
      } else {
        // Mesmo email: reutilizar token existente
        this.loggger.log(
          'Mesmo email detectado, reutilizando token de confirmação'
        )
        confirmationToken = existingPending.confirmationToken
      }
    } else {
      // Não existe pending, criar novo
      this.loggger.log('Nenhum pending encontrado, criando novo')

      const result =
        await this.pendingCandidatesService.createOrUpdatePendingCandidate(
          {
            candidateName: encryptedName,
            candidateEmail: encryptedEmail,
            candidateDocumentType: dto.candidateDocumentType,
            candidateUniqueDocument: dto.candidateUniqueDocument,
            candidatePhone: encryptedPhone,
            orderCode: dto.orderCode,
            processId: dto.processId
          },
          dto.orderCode
        )

      confirmationToken = result.confirmationToken
    }

    // j) Enviar email de confirmação (sempre envia, mesmo para reenvio)
    // Email é enviado com dados NÃO criptografados (originais do DTO)
    await this.sendConfirmationEmail(
      dto.candidateName,
      dto.candidateEmail,
      confirmationToken
    )

    this.loggger.log(`Email de confirmação enviado para ${dto.candidateEmail}`)

    return {
      message:
        'Cadastro iniciado com sucesso! Verifique seu email para confirmar o cadastro.'
    }
  }

  /**
   * Confirma o cadastro de um candidato pendente
   *
   * Fluxo:
   * a) Buscar pending por token
   * b) Verificar se token não expirou (< tokenExpiresAt)
   * c) Verificar se não foi invalidado (invalidatedAt === null)
   * d) Verificar se orderCode ainda está disponível (dupla verificação)
   * e) Inserir na tabela Candidates com orderCode e data de validação
   * f) Marcar pending como confirmado (confirmedAt = now)
   * g) Enviar email de confirmação de sucesso
   * h) Retornar mensagem de sucesso
   *
   * @param token Token de confirmação
   * @returns Mensagem de sucesso
   */
  async confirmRegistration(token: string): Promise<{ message: string }> {
    this.loggger.log(
      `Iniciando confirmação de registro para token: ${token.substring(0, 10)}...`
    )

    // a, b, c) Buscar e validar token (verifica expiração e invalidação)
    const pendingCandidate =
      await this.pendingCandidatesService.validateConfirmationToken(token)

    this.loggger.log(
      `Token validado para pending candidate ID: ${pendingCandidate.pendingCandidateId}`
    )

    // d) Verificar se orderCode ainda está disponível (dupla verificação)
    const orderCodeUsed = await this.candidatesRepo.isOrderCodeInCandidates(
      pendingCandidate.orderCode
    )

    if (orderCodeUsed) {
      this.loggger.error(
        `OrderCode ${pendingCandidate.orderCode} foi usado por outro candidato durante a confirmação`
      )
      throw new BadRequestException(
        '#Este código de pedido já foi utilizado por outro candidato. Entre em contato com o suporte.'
      )
    }

    // Verificar novamente se candidato já existe no processo (race condition)
    const candidateExists = await this.candidatesRepo.candidateExistsInProcess(
      pendingCandidate.processId,
      pendingCandidate.candidateUniqueDocument
    )

    if (candidateExists) {
      this.loggger.warn(
        `Candidato com documento já existe no processo ${pendingCandidate.processId} durante confirmação`
      )
      throw new BadRequestException(
        '#Você já está cadastrado neste processo seletivo.'
      )
    }

    // e) Inserir na tabela Candidates com orderCode e data de validação
    this.loggger.log('Inserindo candidato confirmado na tabela Candidates')

    const candidateId = await this.candidatesRepo.insertCandidateFromPending({
      processId: pendingCandidate.processId,
      candidateName: pendingCandidate.candidateName,
      candidateDocumentType: pendingCandidate.candidateDocumentType,
      candidateUniqueDocument: pendingCandidate.candidateUniqueDocument,
      candidateEmail: pendingCandidate.candidateEmail,
      candidatePhone: pendingCandidate.candidatePhone,
      candidateOrderCode: pendingCandidate.orderCode
    })

    this.loggger.log(`Candidato inserido com ID: ${candidateId}`)

    // f) Marcar pending como confirmado (confirmedAt = now)
    await this.pendingCandidatesService.confirmPendingCandidate(
      pendingCandidate.pendingCandidateId
    )

    this.loggger.log(
      `Pending candidate ${pendingCandidate.pendingCandidateId} marcado como confirmado`
    )

    // g) Enviar email de confirmação de sucesso
    // Descriptografar nome e email antes de enviar
    const decryptedName = this.encryptionService.decrypt(
      pendingCandidate.candidateName
    )
    const decryptedEmail = this.encryptionService.decrypt(
      pendingCandidate.candidateEmail
    )

    await this.sendRegistrationConfirmedEmail(decryptedName, decryptedEmail)

    // h) Retornar mensagem de sucesso
    return {
      message:
        'Cadastro confirmado com sucesso! Em breve você receberá o link para acessar o formulário.'
    }
  }

  /**
   * Obtém status de cadastro para um orderCode (admin only - debug)
   *
   * Retorna informações sobre:
   * - Se orderCode está em Candidates (confirmado)
   * - Se orderCode está em PendingCandidates (pendente)
   * - Detalhes do pending (se existir)
   *
   * @param orderCode Código do pedido
   * @returns Status detalhado do cadastro
   */
  async getRegistrationStatus(orderCode: string): Promise<{
    orderCode: string
    isConfirmed: boolean
    isPending: boolean
    pendingDetails?: {
      pendingCandidateId: number
      candidateName: string
      candidateEmail: string
      processId: number
      tokenExpiresAt: Date
      attemptCount: number
      createdAt: Date
      confirmedAt: Date | null
      invalidatedAt: Date | null
      isExpired: boolean
      isValid: boolean
    }
    candidateId?: number
  }> {
    this.loggger.log(
      `Verificando status de cadastro para orderCode: ${orderCode}`
    )

    // Verificar se está confirmado
    const isConfirmed =
      await this.candidatesRepo.isOrderCodeInCandidates(orderCode)

    // Buscar pending
    const pendingCandidate =
      await this.pendingCandidatesService.findPendingByOrderCode(orderCode)

    const isPending = !!pendingCandidate

    let candidateId: number | undefined

    // Se confirmado, buscar ID do candidato
    if (isConfirmed) {
      const candidate =
        await this.candidatesRepo.findCandidateByOrderCode(orderCode)
      candidateId = candidate?.candidateId
    }

    // Montar resposta
    const response: any = {
      orderCode,
      isConfirmed,
      isPending
    }

    if (pendingCandidate) {
      const now = new Date()
      const isExpired = now > pendingCandidate.tokenExpiresAt
      const isValid =
        !pendingCandidate.confirmedAt &&
        !pendingCandidate.invalidatedAt &&
        !isExpired

      // Descriptografar nome e email para exibição
      const decryptedName = this.encryptionService.decrypt(
        pendingCandidate.candidateName
      )
      const decryptedEmail = this.encryptionService.decrypt(
        pendingCandidate.candidateEmail
      )

      response.pendingDetails = {
        pendingCandidateId: pendingCandidate.pendingCandidateId,
        candidateName: decryptedName,
        candidateEmail: decryptedEmail,
        processId: pendingCandidate.processId,
        tokenExpiresAt: pendingCandidate.tokenExpiresAt,
        attemptCount: pendingCandidate.attemptCount,
        createdAt: pendingCandidate.createdAt,
        confirmedAt: pendingCandidate.confirmedAt,
        invalidatedAt: pendingCandidate.invalidatedAt,
        isExpired,
        isValid
      }
    }

    if (candidateId) {
      response.candidateId = candidateId
    }

    return response
  }

  /**
   * Reenvia email de confirmação para um candidato pendente
   *
   * Fluxo:
   * - Buscar pending por orderCode
   * - Verificar se ainda está válido (não confirmado, não invalidado, não expirado)
   * - Reenviar email com o mesmo token
   *
   * @param dto Dados para reenvio (orderCode)
   * @returns Mensagem de sucesso
   */
  async resendConfirmation(dto: {
    orderCode: string
  }): Promise<{ message: string }> {
    this.loggger.log(
      `Iniciando reenvio de confirmação para orderCode: ${dto.orderCode}`
    )

    // Buscar pending por orderCode
    const pendingCandidate =
      await this.pendingCandidatesService.findPendingByOrderCode(dto.orderCode)

    if (!pendingCandidate) {
      this.loggger.warn(
        `Nenhum pending encontrado para orderCode: ${dto.orderCode}`
      )
      throw new BadRequestException(
        '#Nenhum cadastro pendente encontrado para este código de pedido.'
      )
    }

    // Verificar se já foi confirmado
    if (pendingCandidate.confirmedAt) {
      this.loggger.warn(
        `Pending ${pendingCandidate.pendingCandidateId} já foi confirmado em ${pendingCandidate.confirmedAt.toISOString()}`
      )
      throw new BadRequestException(
        '#Este cadastro já foi confirmado. Aguarde o email com o link do formulário.'
      )
    }

    // Verificar se foi invalidado
    if (pendingCandidate.invalidatedAt) {
      this.loggger.warn(
        `Pending ${pendingCandidate.pendingCandidateId} foi invalidado em ${pendingCandidate.invalidatedAt.toISOString()}`
      )
      throw new BadRequestException(
        '#Este cadastro foi invalidado. Por favor, realize o cadastro novamente.'
      )
    }

    // Verificar se token expirou
    const now = new Date()
    if (now > pendingCandidate.tokenExpiresAt) {
      this.loggger.warn(
        `Token do pending ${pendingCandidate.pendingCandidateId} expirou em ${pendingCandidate.tokenExpiresAt.toISOString()}`
      )
      throw new BadRequestException(
        '#O link de confirmação expirou. Por favor, realize o cadastro novamente.'
      )
    }

    // Descriptografar nome e email para envio
    const decryptedName = this.encryptionService.decrypt(
      pendingCandidate.candidateName
    )
    const decryptedEmail = this.encryptionService.decrypt(
      pendingCandidate.candidateEmail
    )

    // Reenviar email com o mesmo token
    await this.sendConfirmationEmail(
      decryptedName,
      decryptedEmail,
      pendingCandidate.confirmationToken
    )

    this.loggger.log(
      `Email de confirmação reenviado para ${decryptedEmail} (pending ID: ${pendingCandidate.pendingCandidateId})`
    )

    return {
      message:
        'Email de confirmação reenviado com sucesso! Verifique sua caixa de entrada.'
    }
  }

  /**
   * Envia email de confirmação de cadastro
   * @param candidateName Nome do candidato
   * @param candidateEmail Email do candidato (não criptografado)
   * @param confirmationToken Token de confirmação
   */
  private async sendConfirmationEmail(
    candidateName: string,
    candidateEmail: string,
    confirmationToken: string
  ): Promise<void> {
    try {
      const frontendUrl = getFrontendUrl()
      const confirmationLink = `${frontendUrl}/confirm-registration/${confirmationToken}`

      // Obter tempo de expiração do .env (padrão: 60 minutos)
      const expirationMinutes = Number(
        process.env.CONFIRMATION_TOKEN_EXPIRATION || 60
      )

      const html = getConfirmationEmailTemplate(
        candidateName,
        confirmationLink,
        expirationMinutes
      )

      await this.sendPulseEmailService.sendEmail(
        candidateEmail,
        candidateName,
        html
      )

      this.loggger.log(`Email de confirmação enviado para ${candidateEmail}`)
    } catch (error) {
      this.loggger.error(
        `Erro ao enviar email de confirmação para ${candidateEmail}:`,
        error.stack
      )
      // Não lança erro aqui para não falhar o cadastro se o email falhar
      // O candidato pode tentar reenviar depois
    }
  }

  /**
   * Envia email de cadastro confirmado com sucesso
   * @param candidateName Nome do candidato
   * @param candidateEmail Email do candidato (não criptografado)
   */
  private async sendRegistrationConfirmedEmail(
    candidateName: string,
    candidateEmail: string
  ): Promise<void> {
    try {
      const html = getRegistrationConfirmedTemplate(candidateName)

      await this.sendPulseEmailService.sendEmail(
        candidateEmail,
        candidateName,
        html
      )

      this.loggger.log(
        `Email de cadastro confirmado enviado para ${candidateEmail}`
      )
    } catch (error) {
      this.loggger.error(
        `Erro ao enviar email de cadastro confirmado para ${candidateEmail}:`,
        error.stack
      )
      // Não lança erro aqui para não falhar a confirmação se o email falhar
    }
  }

  /**
   * 8.1 - Limpa candidatos pendentes expirados
   * Executa a cada 6 horas
   * Deleta pendings não confirmados antigos e confirmados antigos
   */
  @Cron('0 */6 * * *')
  async cleanExpiredPendingCandidates() {
    this.loggger.info(
      '\n=== Executando cron: Limpeza de candidatos pendentes expirados ==='
    )

    try {
      await this.pendingCandidatesService.cleanupExpiredPendings()
      this.loggger.info('\n=== Limpeza de pendings concluída com sucesso ===')
    } catch (error) {
      this.loggger.error(
        'Erro ao executar limpeza de candidatos pendentes:',
        error.stack
      )
    }
  }

  /**
   * 8.2 - Processa candidatos de processos que estão no período de respostas
   * Gera códigos de acesso e envia emails apenas para formulários do tipo "candidate"
   * Frequência configurável via PROCESS_CANDIDATES_CRON_FREQUENCY (padrão: a cada 30 minutos)
   * Agora processa apenas candidatos já confirmados (não busca mais da API)
   */
  async handleProcessesInAnswerPeriod() {
    this.loggger.info(
      '\n=== Iniciando cron: Processar candidatos no período de respostas ==='
    )

    const startTime = new Date()

    const processes: ProcessInAnswerPeriod[] =
      await this.candidatesRepo.findProcessesInAnswerPeriod()

    this.loggger.info(
      `\n=== Total de processos encontrados: ${processes.length} ===`
    )

    for (const process of processes) {
      // Buscar formulários do processo
      const sForms: SFormBasic[] =
        await this.candidatesRepo.findSFormsByProcessId(process.processId)

      // Buscar candidatos que não estão na tabela FormsCandidates
      const candidatesNotInFormsCandidates: number[] =
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
        const insertedIds: number[] =
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

    const endTime = new Date()
    const duration = (endTime.getTime() - startTime.getTime()) / 1000

    this.loggger.info(
      `\n=== Finalizando cron: Processamento concluído em ${duration}s ===`
    )
  }

  /**
   * ============================================================================
   * MÉTODO LEGADO - DESABILITADO
   * ============================================================================
   *
   * MUDANÇA DE ARQUITETURA (Novembro 2025):
   *
   * Este cron foi parte da arquitetura antiga onde candidatos eram importados
   * automaticamente da API externa e inseridos diretamente na tabela Candidates.
   *
   * NOVA ARQUITETURA:
   * 1. Candidatos se auto-cadastram via endpoint público (POST /candidates/self-register)
   * 2. Sistema valida orderCode na API externa
   * 3. Candidato confirma email
   * 4. Apenas após confirmação, registro é inserido em Candidates
   * 5. handleProcessesInAnswerPeriod() (cron independente) processa confirmados
   *
   * MOTIVO DA DESABILITAÇÃO:
   * - Evitar duplicação: candidatos agora entram via auto-cadastro
   * - Segurança: validação de email obrigatória
   * - Controle: candidato gerencia seu próprio cadastro
   *
   * MANTIDO COMENTADO: Para referência e possível reativação emergencial
   *
   * Para reativar: descomentar e adicionar @Cron('40 15 * * *')
   * ============================================================================
   */
  // @Cron('40 15 * * *')
  // async handleProcessInSubscriptionCron() {
  //   const processes: Process[] =
  //     await this.candidatesRepo.findProcessInSubscription()
  //
  //   const baseUrl = process.env.PROCESS_CANDIDATES_API
  //
  //   if (!baseUrl) {
  //     this.loggger.error('#PROCESS_CANDIDATES_API não está definido no .env')
  //     return
  //   }
  //
  //   const allCandidates: CreateCandidate[] = []
  //
  //   // Buscar candidatos de cada processo
  //   for (const process of processes) {
  //     try {
  //       const apiUrl = `${baseUrl}${process.processDataKey}`
  //       const response: { data: any[] } =
  //         await this.externalApiService.get(apiUrl)
  //
  //       this.loggger.info(
  //         `Resposta da API para processo ${process.processDataKey}:`,
  //         response.data.toString()
  //       )
  //
  //       // Transformar dados da API em candidatos
  //       const candidates: CreateCandidate[] = this.parseApiResponseToCandidates(
  //         response.data,
  //         process.processId
  //       )
  //
  //       this.loggger.info(
  //         `\n=== Candidatos coletados para processo ${process.processTitle} ===`
  //       )
  //
  //       allCandidates.push(...candidates)
  //     } catch (error) {
  //       this.loggger.error(
  //         `Erro ao buscar candidatos do processo ${process.processDataKey}:`,
  //         error.stack
  //       )
  //     }
  //   }
  //
  //   // Processar inserção dos candidatos
  //   if (allCandidates.length > 0) {
  //     await this.processCandidatesInsertion(allCandidates)
  //   } else {
  //     this.loggger.info('\n=== Nenhum candidato encontrado para inserir ===')
  //     await this.sendImportSummaryEmail(0, 0, 0)
  //   }
  // }

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
   * Se válido, verifica termos ativos não assinados para o candidato
   * Retorna Terms[] se houver termos pendentes, ou FormToAnswer se não houver
   */
  async validateAccessCode(accessCode: string): Promise<Term[] | FormToAnswer> {
    await this.formsCandidatesService.validateAccessCodeAndGetFormCandidateId(
      accessCode
    )

    const formCandidate =
      await this.candidatesRepo.findFormCandidateByAccessCode(accessCode)

    if (!formCandidate) {
      throw new Error(
        '#Candidato não encontrado para o código de acesso fornecido.'
      )
    }

    // Buscar termos ativos para candidatos
    const activeTerms = await this.candidatesRepo.findActiveTermsForCandidate()

    console.log('activeTerms', activeTerms)

    if (activeTerms.length > 0) {
      const activeTermIds = activeTerms.map((term) => term.termId)

      // Buscar termos não assinados para este formCandidate
      const unsignedTerms =
        await this.candidatesRepo.findUnsignedTermsForFormCandidate(
          formCandidate.formCandidateId,
          activeTermIds
        )

      // Se há termos não assinados, retorna eles
      if (unsignedTerms.length > 0) {
        return unsignedTerms
      }
    }

    // Se não há termos pendentes, montar o FormToAnswer
    return await this.buildFormToAnswer(
      formCandidate.sFormId,
      formCandidate.formCandidateId
    )
  }

  /**
   * Assina termos para um candidato
   * Valida o código de acesso e verifica se os IDs dos termos correspondem aos termos pendentes
   */
  async signTerms(
    accessCode: string,
    signTermsDto: SignTermsDto
  ): Promise<{ message: string }> {
    const { termIds } = signTermsDto

    // Validar o código de acesso e obter o formCandidateId
    const formCandidateId =
      await this.formsCandidatesService.validateAccessCodeAndGetFormCandidateId(
        accessCode
      )

    // Buscar termos ativos para candidatos
    const activeTerms = await this.candidatesRepo.findActiveTermsForCandidate()

    if (activeTerms.length === 0) {
      throw new BadRequestException('#Não há termos ativos para assinar.')
    }

    const activeTermIds = activeTerms.map((term) => term.termId)

    // Buscar termos não assinados para este formCandidate
    const unsignedTerms =
      await this.candidatesRepo.findUnsignedTermsForFormCandidate(
        formCandidateId,
        activeTermIds
      )

    const unsignedTermIds = unsignedTerms.map((term) => term.termId)

    // Verificar se os IDs dos termos enviados correspondem exatamente aos termos não assinados
    if (termIds.length !== unsignedTermIds.length) {
      throw new BadRequestException(
        '#A quantidade de termos enviados não corresponde à quantidade de termos pendentes.'
      )
    }

    // Verificar se todos os IDs enviados estão na lista de termos não assinados
    for (const termId of termIds) {
      if (!unsignedTermIds.includes(termId)) {
        throw new BadRequestException(
          `#O termo com ID ${termId} não está na lista de termos pendentes ou já foi assinado.`
        )
      }
    }

    // Verificar se todos os termos não assinados foram enviados
    for (const unsignedTermId of unsignedTermIds) {
      if (!termIds.includes(unsignedTermId)) {
        throw new BadRequestException(
          `#O termo com ID ${unsignedTermId} é obrigatório e não foi incluído na assinatura.`
        )
      }
    }

    // Inserir as assinaturas dos termos
    await this.candidatesRepo.insertCandidateTermsSignatures(
      formCandidateId,
      termIds
    )

    return {
      message: `Termos assinados com sucesso. Total de ${termIds.length} termo(s) assinado(s).`
    }
  }

  /**
   * Monta o FormToAnswer buscando cada parte separadamente
   */
  private async buildFormToAnswer(
    sFormId: number,
    formCandidateId: number
  ): Promise<FormToAnswer> {
    // 1. Buscar o formulário
    const form = await this.candidatesRepo.findFormById(sFormId)

    if (!form) {
      throw new Error('#Formulário não encontrado.')
    }

    // 2. Buscar as seções do formulário
    const sections = await this.candidatesRepo.findSectionsByFormId(sFormId)

    // 3. Para cada seção, buscar as questões
    const sectionsWithQuestions: SectionToAnswer[] = []

    for (const section of sections) {
      const questions = await this.candidatesRepo.findQuestionsBySectionId(
        section.formSectionId
      )

      // 4. Para cada questão, buscar options, validations e subquestions
      const questionsComplete: QuestionToAnswer[] = []

      for (const question of questions) {
        const options = await this.candidatesRepo.findOptionsByQuestionId(
          question.questionId
        )

        const validations =
          await this.candidatesRepo.findValidationsByQuestionId(
            question.questionId
          )

        const subQuestions =
          await this.candidatesRepo.findSubQuestionsByQuestionId(
            question.questionId
          )

        // Para cada subquestão, buscar suas options e validations
        const subQuestionsComplete: SubQuestionToAnswer[] = []

        for (const subQuestion of subQuestions) {
          const subQuestionOptions =
            await this.candidatesRepo.findSubQuestionOptions(
              subQuestion.subQuestionId
            )

          const subValidations = await this.candidatesRepo.findSubValidations(
            subQuestion.subQuestionId
          )

          subQuestionsComplete.push({
            subQuestionId: subQuestion.subQuestionId,
            subQuestionPosition: subQuestion.subQuestionPosition,
            subQuestionType: subQuestion.subQuestionType,
            subQuestionStatement: subQuestion.subQuestionStatement,
            subQuestionOptions,
            subValidations
          })
        }

        // Buscar questões dependentes (questions que referenciam esta question)
        const dependentQuestions =
          await this.candidatesRepo.findDependentQuestionsByQuestionId(
            question.questionId
          )

        // Buscar seções dependentes (sections que referenciam esta question)
        const dependentSections =
          await this.candidatesRepo.findDependentSectionsByQuestionId(
            question.questionId
          )

        // Buscar answer existente ou criar uma fake sem answerId
        const existingAnswerEncrypted =
          await this.candidatesRepo.findAnswerByQuestionAndFormCandidate(
            question.questionId,
            formCandidateId
          )

        // Descriptografar answer se existir
        const existingAnswer = decryptAnswer(
          existingAnswerEncrypted,
          this.encryptionService
        )

        const answer: AnswerWithoutId = existingAnswer
          ? {
              answerValue: existingAnswer.answerValue,
              validAnswer: existingAnswer.validAnswer
            }
          : {
              answerValue: null,
              validAnswer: true
            }

        questionsComplete.push({
          questionId: question.questionId,
          questionOrder: question.questionOrder,
          questionType: question.questionType,
          questionStatement: question.questionStatement,
          questionDescription: question.questionDescription,
          options,
          validations,
          subQuestions: subQuestionsComplete,
          dependentQuestions,
          dependentSections,
          answer
        })
      }

      sectionsWithQuestions.push({
        formSectionId: section.formSectionId,
        formSectionName: section.formSectionName,
        formSectionOrder: section.formSectionOrder,
        questions: questionsComplete
      })
    }

    return {
      sFormId: form.sFormId,
      sFormName: form.sFormName,
      sections: sectionsWithQuestions
    }
  }

  /**
   * Envia email para candidato do tipo "candidate"
   * Método unificado usado tanto no primeiro envio quanto no reenvio
   */
  private async sendCandidateFormEmail(
    candidateName: string,
    candidateEmail: string,
    accessCode: string,
    frontendUrl: string,
    emailTemplate: (name: string, link: string, code: string) => string,
    emailType: 'primeiro acesso' | 'reenvio'
  ): Promise<void> {
    try {
      const { recipientName, recipientEmail, html } = prepareCandidateEmailData(
        candidateName,
        candidateEmail,
        accessCode,
        frontendUrl,
        this.encryptionService,
        emailTemplate
      )

      await this.sendPulseEmailService.sendEmail(
        recipientEmail,
        recipientName,
        html
      )

      this.loggger.info(
        `Email de ${emailType} enviado para ${recipientName} (${recipientEmail})`
      )
    } catch (error) {
      this.loggger.error(`Erro ao enviar email de ${emailType}:`, error.stack)
    }
  }

  /**
   * ============================================================================
   * MÉTODO LEGADO - DESABILITADO
   * ============================================================================
   * Usado apenas por handleProcessInSubscriptionCron (desabilitado)
   * Mantido comentado para referência
   */
  // private async processCandidatesInsertion(allCandidates: CreateCandidate[]) {
  //   try {
  //     // Agrupar candidatos por processo para verificar duplicatas
  //     const candidatesByProcess = new Map<number, CreateCandidate[]>()
  //     allCandidates.forEach((candidate) => {
  //       if (!candidatesByProcess.has(candidate.processId)) {
  //         candidatesByProcess.set(candidate.processId, [])
  //       }
  //       candidatesByProcess.get(candidate.processId)!.push(candidate)
  //     })

  //     const candidatesToInsert: CreateCandidate[] = []
  //     let duplicatesCount = 0

  //     // Verificar duplicatas para cada processo
  //     for (const [processId, candidates] of candidatesByProcess) {
  //       const uniqueDocuments: string[] = candidates.map(
  //         (c) => c.candidateUniqueDocument
  //       )
  //       const existingDocuments: string[] =
  //         await this.candidatesRepo.findExistingCandidatesByProcessAndDocument(
  //           processId,
  //           uniqueDocuments
  //         )

  //       // Filtrar apenas os candidatos que não existem
  //       const newCandidates: CreateCandidate[] = candidates.filter(
  //         (candidate) =>
  //           !existingDocuments.includes(candidate.candidateUniqueDocument)
  //       )

  //       duplicatesCount += candidates.length - newCandidates.length
  //       candidatesToInsert.push(...newCandidates)
  //     }

  //     // Inserir novos candidatos
  //     if (candidatesToInsert.length > 0) {
  //       await this.candidatesRepo.insertCandidatesInBatch(candidatesToInsert)
  //       this.loggger.info(
  //         `\n=== Total de ${candidatesToInsert.length} candidatos inseridos com sucesso ===`
  //       )
  //     }

  //     if (duplicatesCount > 0) {
  //       this.loggger.info(
  //         `\n=== ${duplicatesCount} candidatos duplicados foram ignorados ===`
  //       )
  //     }

  //     // Enviar email com resumo
  //     await this.sendImportSummaryEmail(
  //       allCandidates.length,
  //       duplicatesCount,
  //       candidatesToInsert.length
  //     )
  //   } catch (error) {
  //     this.loggger.error('Erro ao inserir candidatos em batch:', error.stack)
  //   }
  // }

  /**
   * ============================================================================
   * MÉTODO LEGADO - DESABILITADO
   * ============================================================================
   * Envia email com resumo da importação de candidatos
   * Usado apenas por processCandidatesInsertion (desabilitado)
   * Mantido comentado para referência
   */
  // private async sendImportSummaryEmail(
  //   totalFound: number,
  //   totalDuplicated: number,
  //   totalInserted: number
  // ) {
  //   try {
  //     const html = getImportSummaryEmailTemplate(
  //       totalFound,
  //       totalDuplicated,
  //       totalInserted
  //     )

  //     await this.sendPulseEmailService.sendEmail(
  //       'werterpires23@hotmail.com',
  //       'Werter Pires',
  //       html
  //     )

  //     this.loggger.info('Email de resumo enviado com sucesso')
  //   } catch (error) {
  //     this.loggger.error('Erro ao enviar email de resumo:', error.stack)
  //   }
  // }

  /**
   * ============================================================================
   * MÉTODO LEGADO - DESABILITADO
   * ============================================================================
   * Converte resposta da API em array de candidatos
   * Utiliza helper para transformação
   * Usado apenas por handleProcessInSubscriptionCron (desabilitado)
   * Mantido comentado para referência
   */
  // private parseApiResponseToCandidates(
  //   apiData: any[],
  //   processId: number
  // ): CreateCandidate[] {
  //   const candidates: CreateCandidate[] = []

  //   for (const item of apiData) {
  //     const candidate = transformApiItemToCandidate(
  //       item,
  //       processId,
  //       this.encryptionService
  //     )

  //     if (candidate) {
  //       candidates.push(candidate)
  //     }
  //   }

  //   return candidates
  // }

  /**
   * Envia emails apenas para formulários do tipo "candidate"
   * Otimizado com uma única query para buscar todos os dados necessários
   */
  private async sendEmailsForCandidateForms(formsCandidatesIds: number[]) {
    const frontendUrl = getFrontendUrl()

    // Buscar todos os dados de uma vez (query otimizada com JOIN)
    const formsCandidatesData: FormCandidateWithDetails[] =
      await this.candidatesRepo.findCandidatesWithFormsCandidatesByIds(
        formsCandidatesIds
      )

    for (const formCandidateData of formsCandidatesData) {
      // Processar apenas formulários do tipo "candidate"
      if (formCandidateData.sFormType === 'candidate') {
        await this.sendCandidateFormEmail(
          formCandidateData.candidateName,
          formCandidateData.candidateEmail,
          formCandidateData.formCandidateAccessCode,
          frontendUrl,
          getCandidateFormAccessEmailTemplate,
          'primeiro acesso'
        )

        // Atualizar status para MAILED após envio bem-sucedido
        await this.candidatesRepo.updateFormCandidateStatus(
          formCandidateData.candidateId,
          formCandidateData.sFormId,
          FormCandidateStatus.MAILED
        )

        this.loggger.info('Status atualizado para MAILED')
      }
      // Formulários "normal" e "ministerial" serão processados em outro cron
      // quando a tabela de respostas estiver disponível
    }
  }
}
