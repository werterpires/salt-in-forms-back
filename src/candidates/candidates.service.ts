import { Injectable, BadRequestException } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CandidatesRepo } from './candidates.repo'
import { ExternalApiService } from '../shared/utils-module/external-api/external-api.service'
import { EncryptionService } from '../shared/utils-module/encryption/encryption.service'
import { UsersRepo } from '../users/users.repo'
import {
  FormToAnswer,
  SectionToAnswer,
  QuestionToAnswer,
  SubQuestionToAnswer,
  CandidateBasicInfo
} from './types'
import { FindAllResponse, Paginator } from '../shared/types/types'
import * as db from '../constants/db-schema.enum'
import { CustomLoggerService } from 'src/shared/utils-module/custom-logger/custom-logger.service'
import { SendPulseEmailService } from '../shared/utils-module/email-sender/sendpulse-email.service'
import { getFrontendUrl, decryptAnswer } from './candidates.helper'
import { Term } from 'src/terms/types'
import { FormsCandidatesService } from 'src/forms-candidates/forms-candidates.service'
import { AnswerWithoutId } from 'src/answers/types'
import { SignTermsDto } from './dto/sign-terms.dto'
import { SelfRegisterCandidateDto } from './dto/self-register-candidate.dto'
import { CompleteRegistrationDto } from './dto/complete-registration.dto'
import { PendingCandidatesService } from './pending-candidates.service'
import { ExternalOrderValidationService } from './external-order-validation.service'
import { getConfirmationEmailTemplate } from './email-templates/confirmation-email.template'
import { getRegistrationConfirmedTemplate } from './email-templates/registration-confirmed.template'

@Injectable()
export class CandidatesService {
  constructor(
    private readonly candidatesRepo: CandidatesRepo,
    private readonly externalApiService: ExternalApiService,
    private readonly encryptionService: EncryptionService,
    private readonly loggger: CustomLoggerService,
    private readonly sendPulseEmailService: SendPulseEmailService,
    private readonly formsCandidatesService: FormsCandidatesService,
    private readonly pendingCandidatesService: PendingCandidatesService,
    private readonly externalOrderValidationService: ExternalOrderValidationService,
    private readonly usersRepo: UsersRepo
  ) {}

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

    console.log(process)

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

  async confirmRegistration(
    token: string
  ): Promise<{ message: string; confirmationToken: string }> {
    this.loggger.log(
      `Iniciando confirmação de registro para token: ${token.substring(0, 10)}...`
    )

    // a, b, c) Buscar e validar token (verifica expiração e invalidação)
    const pendingCandidate =
      await this.pendingCandidatesService.validateConfirmationToken(token)

    this.loggger.log(
      `Token validado para pending candidate ID: ${pendingCandidate.pendingCandidateId}`
    )

    // Verificar se já foi confirmado
    if (pendingCandidate.confirmedAt) {
      this.loggger.log(
        `Pending ${pendingCandidate.pendingCandidateId} já foi confirmado anteriormente`
      )
      return {
        message:
          'Email já confirmado! Por favor, complete seu cadastro com as informações adicionais.',
        confirmationToken: token
      }
    }

    // d) Marcar pending como confirmado (confirmedAt = now)
    await this.pendingCandidatesService.confirmPendingCandidate(
      pendingCandidate.pendingCandidateId
    )

    this.loggger.log(
      `Pending candidate ${pendingCandidate.pendingCandidateId} marcado como confirmado`
    )

    // e) Retornar token para uso no endpoint de complementação
    return {
      message:
        'Email confirmado com sucesso! Por favor, complete seu cadastro com as informações adicionais.',
      confirmationToken: token
    }
  }

  async completeRegistration(
    token: string,
    dto: CompleteRegistrationDto
  ): Promise<{ message: string }> {
    this.loggger.log(
      `Iniciando complementação de cadastro para token: ${token.substring(0, 10)}...`
    )

    // a) Buscar e validar token
    const pendingCandidate =
      await this.pendingCandidatesService.validateConfirmationToken(token)

    this.loggger.log(
      `Token validado para pending candidate ID: ${pendingCandidate.pendingCandidateId}`
    )

    // b) Verificar se pending foi confirmado
    if (!pendingCandidate.confirmedAt) {
      this.loggger.warn(
        `Pending ${pendingCandidate.pendingCandidateId} ainda não foi confirmado`
      )
      throw new BadRequestException(
        '#Você precisa confirmar seu email antes de completar o cadastro.'
      )
    }

    // c) Verificar se orderCode ainda está disponível (dupla verificação)
    const orderCodeUsed = await this.candidatesRepo.isOrderCodeInCandidates(
      pendingCandidate.orderCode
    )

    if (orderCodeUsed) {
      this.loggger.error(
        `OrderCode ${pendingCandidate.orderCode} já foi usado durante complementação`
      )
      throw new BadRequestException(
        '#Este cadastro já foi completado anteriormente ou o código de pedido foi utilizado por outro candidato.'
      )
    }

    // d) Verificar se candidato já existe no processo (race condition)
    const candidateExists = await this.candidatesRepo.candidateExistsInProcess(
      pendingCandidate.processId,
      pendingCandidate.candidateUniqueDocument
    )

    if (candidateExists) {
      this.loggger.warn(
        `Candidato com documento já existe no processo ${pendingCandidate.processId} durante complementação`
      )
      throw new BadRequestException(
        '#Você já está cadastrado neste processo seletivo.'
      )
    }

    // e) Inserir na tabela Candidates com TODOS os campos
    this.loggger.log('Inserindo candidato completo na tabela Candidates')

    const candidateId = await this.candidatesRepo.insertCompleteCandidate({
      processId: pendingCandidate.processId,
      candidateName: pendingCandidate.candidateName,
      candidateDocumentType: pendingCandidate.candidateDocumentType,
      candidateUniqueDocument: pendingCandidate.candidateUniqueDocument,
      candidateEmail: pendingCandidate.candidateEmail,
      candidatePhone: pendingCandidate.candidatePhone,
      candidateOrderCode: pendingCandidate.orderCode,
      candidateBirthdate: dto.candidateBirthdate,
      candidateForeigner: dto.candidateForeigner,
      candidateAddress: dto.candidateAddress,
      candidateAddressNumber: dto.candidateAddressNumber,
      candidateDistrict: dto.candidateDistrict,
      candidateCity: dto.candidateCity,
      candidateState: dto.candidateState,
      candidateZipCode: dto.candidateZipCode,
      candidateCountry: dto.candidateCountry,
      candidateMaritalStatus: dto.candidateMaritalStatus
    })

    this.loggger.log(`Candidato inserido com ID: ${candidateId}`)

    // f) Enviar email de cadastro completo
    const decryptedName = this.encryptionService.decrypt(
      pendingCandidate.candidateName
    )
    const decryptedEmail = this.encryptionService.decrypt(
      pendingCandidate.candidateEmail
    )

    await this.sendRegistrationConfirmedEmail(decryptedName, decryptedEmail)

    this.loggger.log(
      `Email de cadastro completo enviado para ${decryptedEmail}`
    )

    // g) Retornar mensagem de sucesso
    return {
      message:
        'Cadastro completado com sucesso! Em breve você receberá o link para acessar o formulário.'
    }
  }

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

  async getCandidatesByProcess(
    processId: number,
    orderBy: Paginator<typeof db.Candidates>
  ): Promise<FindAllResponse<CandidateBasicInfo>> {
    this.loggger.log(`Buscando candidatos do processo ${processId}`)

    // Buscar todos os formulários do processo
    const sForms = await this.candidatesRepo.findSFormsByProcessId(processId)

    // Buscar candidatos do repositório (dados criptografados)
    const candidates = await this.candidatesRepo.findCandidatesByProcessId(
      processId,
      orderBy
    )

    // Descriptografar dados sensíveis e buscar forms para cada candidato
    const candidatesDecrypted: CandidateBasicInfo[] = []

    for (const candidate of candidates) {
      const forms: { formTitle: string; formStatus: number | null }[] = []

      // Processar apenas formulários do tipo "candidate"
      for (const sForm of sForms) {
        if (sForm.sFormType === 'candidate') {
          // Buscar FormCandidate para este candidato e formulário
          const formCandidate =
            await this.candidatesRepo.findFormCandidateByCandidateAndForm(
              candidate.candidateId,
              sForm.sFormId
            )

          forms.push({
            formTitle: sForm.sFormName,
            formStatus: formCandidate ? formCandidate.formCandidateStatus : null
          })
        }

        // TODO: Implementar lógica para formulários do tipo "normal" e "ministerial"
        // Para estes tipos, será necessário:
        // - "normal": buscar resposta da pergunta vinculada (emailQuestionId) e validar email
        // - "ministerial": implementar lógica específica conforme regras de negócio
      }

      // Buscar nome do entrevistador se existir interviewUserId
      let interviewer: string | null = null
      if (candidate.interviewUserId) {
        interviewer = await this.candidatesRepo.findUserNameById(
          candidate.interviewUserId
        )
      }

      candidatesDecrypted.push({
        candidateId: candidate.candidateId,
        candidateName: this.encryptionService.decrypt(candidate.candidateName),
        candidateUniqueDocument: candidate.candidateUniqueDocument,
        candidateDocumentType: candidate.candidateDocumentType,
        candidateEmail: this.encryptionService.decrypt(
          candidate.candidateEmail
        ),
        candidatePhone: this.encryptionService.decrypt(
          candidate.candidatePhone
        ),
        candidateBirthdate: candidate.candidateBirthdate,
        candidateMaritalStatus: candidate.candidateMaritalStatus,
        interviewer,
        forms
      })
    }

    // Buscar quantidade total de páginas
    const pagesQuantity =
      await this.candidatesRepo.findCandidatesQuantityByProcessId(processId)

    this.loggger.log(
      `Total de ${candidatesDecrypted.length} candidatos encontrados na página ${orderBy.page}`
    )

    const response: FindAllResponse<CandidateBasicInfo> = {
      data: candidatesDecrypted,
      pagesQuantity
    }

    return response
  }

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

  private async sendConfirmationEmail(
    candidateName: string,
    candidateEmail: string,
    confirmationToken: string
  ): Promise<void> {
    try {
      const frontendUrl = getFrontendUrl()
      const confirmationLink = `${frontendUrl}/#/confirm-registration/${confirmationToken}`

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
    }
  }

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
   * Distribui candidatos entre entrevistadores ativos de forma balanceada
   * Prioriza distribuição equitativa de estado civil, seguida de faixa etária
   *
   * IMPORTANTE: Apenas candidatos com TODOS os formulários nos status COMPLETED (8) ou UNUSEFULL (0)
   * são incluídos na distribuição. Candidatos com formulários em outros status são ignorados.
   *
   * @param processId ID do processo
   * @returns Resultado da distribuição com estatísticas
   */
  async distributeInterviewers(processId: number) {
    // 1) Verificar se o processo já terminou o período de resposta
    const process = await this.candidatesRepo.findProcessById(processId)

    if (!process) {
      throw new BadRequestException('Processo não encontrado')
    }

    const today = new Date()
    const endAnswersDate = new Date(process.processEndAnswers)

    if (endAnswersDate >= today) {
      throw new BadRequestException(
        'O período de respostas do processo ainda não terminou'
      )
    }

    // 2) Buscar entrevistadores ativos
    const interviewers = await this.candidatesRepo.findActiveInterviewers()

    if (interviewers.length === 0) {
      throw new BadRequestException('Não há entrevistadores ativos disponíveis')
    }

    // 3) Buscar candidatos do processo
    const candidates =
      await this.candidatesRepo.findCandidatesForDistribution(processId)

    if (candidates.length === 0) {
      throw new BadRequestException('Não há candidatos neste processo')
    }

    // 4) Distribuir candidatos entre entrevistadores
    const assignments = this.calculateDistribution(candidates, interviewers)

    // 5) Salvar distribuição no banco
    await this.candidatesRepo.updateCandidatesInterviewers(assignments)

    return {
      message: 'Candidatos distribuídos com sucesso',
      statistics: {
        totalCandidates: candidates.length,
        totalInterviewers: interviewers.length,
        candidatesPerInterviewer: Math.ceil(
          candidates.length / interviewers.length
        )
      }
    }
  }

  /**
   * Calcula a distribuição ótima de candidatos entre entrevistadores
   * Balanceia estado civil (prioridade 1) e faixa etária (prioridade 2)
   *
   * @param candidates Lista de candidatos
   * @param interviewers Lista de IDs de entrevistadores
   * @returns Array de atribuições {candidateId, interviewUserId}
   */
  private calculateDistribution(
    candidates: Array<{
      candidateId: number
      candidateBirthdate: string
      candidateMaritalStatus: string | null
    }>,
    interviewers: number[]
  ): Array<{ candidateId: number; interviewUserId: number }> {
    // Classificar candidatos por estado civil e idade
    const categorizedCandidates = this.categorizeCandidates(candidates)

    // Inicializar contadores para cada entrevistador
    const interviewerStats = interviewers.map((id) => ({
      interviewUserId: id,
      counters: {
        casado: { jovem: 0, adulto: 0, senior: 0 },
        solteiro: { jovem: 0, adulto: 0, senior: 0 },
        noivo: { jovem: 0, adulto: 0, senior: 0 },
        namorando: { jovem: 0, adulto: 0, senior: 0 },
        divorciado: { jovem: 0, adulto: 0, senior: 0 },
        viuvo: { jovem: 0, adulto: 0, senior: 0 },
        indefinido: { jovem: 0, adulto: 0, senior: 0 }
      },
      total: 0
    }))

    const assignments: Array<{ candidateId: number; interviewUserId: number }> =
      []

    // Processar cada categoria de estado civil
    const maritalStatuses = [
      'casado',
      'solteiro',
      'noivo',
      'namorando',
      'divorciado',
      'viuvo',
      'indefinido'
    ]

    for (const maritalStatus of maritalStatuses) {
      const categoryGroups = categorizedCandidates[maritalStatus]

      // Processar cada faixa etária dentro do estado civil
      for (const ageGroup of ['jovem', 'adulto', 'senior'] as const) {
        const candidatesInGroup = categoryGroups[ageGroup]

        // Distribuir candidatos deste grupo
        for (const candidate of candidatesInGroup) {
          // Encontrar entrevistador com menor quantidade desta categoria específica
          const selectedInterviewer = interviewerStats.reduce((prev, curr) => {
            const prevCount = prev.counters[maritalStatus][ageGroup]
            const currCount = curr.counters[maritalStatus][ageGroup]

            // Se empate, escolher quem tem menos total
            if (prevCount === currCount) {
              return prev.total <= curr.total ? prev : curr
            }

            return prevCount < currCount ? prev : curr
          })

          // Atribuir candidato ao entrevistador
          assignments.push({
            candidateId: candidate.candidateId,
            interviewUserId: selectedInterviewer.interviewUserId
          })

          // Atualizar contadores
          selectedInterviewer.counters[maritalStatus][ageGroup]++
          selectedInterviewer.total++
        }
      }
    }

    return assignments
  }

  /**
   * Categoriza candidatos por estado civil e faixa etária
   *
   * @param candidates Lista de candidatos
   * @returns Objeto com candidatos categorizados
   */
  private categorizeCandidates(
    candidates: Array<{
      candidateId: number
      candidateBirthdate: string
      candidateMaritalStatus: string | null
    }>
  ) {
    const categorized: {
      [maritalStatus: string]: {
        jovem: typeof candidates
        adulto: typeof candidates
        senior: typeof candidates
      }
    } = {
      casado: { jovem: [], adulto: [], senior: [] },
      solteiro: { jovem: [], adulto: [], senior: [] },
      noivo: { jovem: [], adulto: [], senior: [] },
      namorando: { jovem: [], adulto: [], senior: [] },
      divorciado: { jovem: [], adulto: [], senior: [] },
      viuvo: { jovem: [], adulto: [], senior: [] },
      indefinido: { jovem: [], adulto: [], senior: [] }
    }

    for (const candidate of candidates) {
      const age = this.calculateAge(candidate.candidateBirthdate)
      const ageGroup = this.getAgeGroup(age)
      const maritalStatus =
        candidate.candidateMaritalStatus?.toLowerCase() || 'indefinido'

      const category = categorized[maritalStatus] || categorized.indefinido

      category[ageGroup].push(candidate)
    }

    return categorized
  }

  /**
   * Calcula idade a partir da data de nascimento
   *
   * @param birthdate Data de nascimento (string)
   * @returns Idade em anos
   */
  private calculateAge(birthdate: string): number {
    const birth = new Date(birthdate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--
    }

    return age
  }

  /**
   * Define faixa etária baseada na idade
   *
   * @param age Idade em anos
   * @returns Categoria etária (jovem, adulto, senior)
   */
  private getAgeGroup(age: number): 'jovem' | 'adulto' | 'senior' {
    if (age < 24) return 'jovem'
    if (age < 30) return 'adulto'
    return 'senior'
  }

  /**
   * Atribui um entrevistador a um candidato específico
   * Valida se o usuário existe, é entrevistador e está ativo
   *
   * @param userId ID do entrevistador
   * @param candidateId ID do candidato
   * @returns Mensagem de sucesso
   */
  async assignInterviewerToCandidate(
    userId: number,
    candidateId: number
  ): Promise<{ message: string }> {
    // Verificar se o candidato existe
    const candidate = await this.candidatesRepo.findCandidateById(candidateId)
    if (!candidate) {
      throw new BadRequestException('#Candidato não encontrado')
    }

    // Verificar se o usuário é um entrevistador ativo
    const isActiveInterviewer = await this.usersRepo.isActiveInterviewer(userId)

    if (!isActiveInterviewer) {
      throw new BadRequestException(
        '#Usuário não encontrado, não é entrevistador ou não está ativo'
      )
    }

    // Atribuir entrevistador ao candidato
    await this.candidatesRepo.assignInterviewerToCandidate(candidateId, userId)

    return {
      message: '#Entrevistador atribuído ao candidato com sucesso'
    }
  }
}
