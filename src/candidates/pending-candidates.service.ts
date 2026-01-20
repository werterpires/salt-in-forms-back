import { Injectable, BadRequestException } from '@nestjs/common'
import { PendingCandidatesRepo } from './pending-candidates.repo'
import { CustomLoggerService } from '../shared/utils-module/custom-logger/custom-logger.service'
import { CreatePendingCandidate, PendingCandidate } from './types'
import { randomBytes } from 'crypto'

@Injectable()
export class PendingCandidatesService {
  constructor(
    private readonly pendingCandidatesRepo: PendingCandidatesRepo,
    private readonly logger: CustomLoggerService
  ) {
    this.logger.setContext('PendingCandidatesService')
  }

  /**
   * Gera um token único de confirmação
   * @returns Token único
   */
  private generateConfirmationToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Calcula a data de expiração do token
   * @returns Data de expiração
   */
  private calculateTokenExpiration(): Date {
    const expirationMinutes = Number(
      process.env.CONFIRMATION_TOKEN_EXPIRATION || 60
    )
    const expirationDate = new Date()
    expirationDate.setMinutes(expirationDate.getMinutes() + expirationMinutes)
    return expirationDate
  }

  /**
   * Cria ou atualiza um candidato pendente
   * Se já existe um pending com o mesmo orderCode, invalida o anterior e cria novo
   * @param data Dados do candidato
   * @param orderCode Código do pedido
   * @returns ID do pending criado e token de confirmação
   */
  async createOrUpdatePendingCandidate(
    data: Omit<CreatePendingCandidate, 'confirmationToken' | 'tokenExpiresAt'>,
    orderCode: string
  ): Promise<{ pendingCandidateId: number; confirmationToken: string }> {
    this.logger.log(`Criando/atualizando pending para orderCode: ${orderCode}`)

    // Verificar se já existe um pending ativo com este orderCode
    const existingPendings =
      await this.pendingCandidatesRepo.findActivePendingsByOrderCode(orderCode)

    // Invalidar todos os pendings anteriores com este orderCode
    if (existingPendings.length > 0) {
      this.logger.log(
        `Encontrados ${existingPendings.length} pendings ativos. Invalidando...`
      )

      for (const pending of existingPendings) {
        await this.pendingCandidatesRepo.invalidatePendingToken(
          pending.pendingCandidateId
        )

        // Incrementar contador de tentativas se for o mesmo email
        if (pending.candidateEmail === data.candidateEmail) {
          await this.pendingCandidatesRepo.incrementAttemptCount(
            pending.pendingCandidateId
          )
          this.logger.log(
            `Incrementado contador de tentativas para pending ${pending.pendingCandidateId}`
          )
        }
      }
    }

    // Gerar novo token e criar novo pending
    const confirmationToken = this.generateConfirmationToken()
    const tokenExpiresAt = this.calculateTokenExpiration()

    const pendingData: CreatePendingCandidate = {
      ...data,
      orderCode,
      confirmationToken,
      tokenExpiresAt,
      attemptCount:
        existingPendings.length > 0 ? existingPendings.length + 1 : 1
    }

    const pendingCandidateId =
      await this.pendingCandidatesRepo.insertPendingCandidate(pendingData)

    this.logger.log(
      `Pending candidate criado com ID: ${pendingCandidateId}, Token expira em: ${tokenExpiresAt.toISOString()}`
    )

    return { pendingCandidateId, confirmationToken }
  }

  /**
   * Valida um token de confirmação
   * @param token Token de confirmação
   * @returns Candidato pendente se válido
   * @throws BadRequestException se token inválido, expirado ou já confirmado
   */
  async validateConfirmationToken(token: string): Promise<PendingCandidate> {
    this.logger.log(
      `Validando token de confirmação: ${token.substring(0, 10)}...`
    )

    const pending = await this.pendingCandidatesRepo.findPendingByToken(token)

    if (!pending) {
      this.logger.warn('Token não encontrado')
      throw new BadRequestException('#Token de confirmação inválido')
    }

    // Verificar se foi invalidado
    if (pending.invalidatedAt) {
      this.logger.warn(
        `Token foi invalidado em: ${pending.invalidatedAt.toISOString()}`
      )
      throw new BadRequestException(
        '#Este token foi invalidado. Um novo email de confirmação pode ter sido enviado.'
      )
    }

    // Verificar se já foi confirmado
    if (pending.confirmedAt) {
      this.logger.warn(
        `Token já foi confirmado em: ${pending.confirmedAt.toISOString()}`
      )
      throw new BadRequestException('#Este cadastro já foi confirmado')
    }

    // Verificar se expirou
    const now = new Date()
    if (now > pending.tokenExpiresAt) {
      this.logger.warn(
        `Token expirou em: ${pending.tokenExpiresAt.toISOString()}`
      )
      throw new BadRequestException(
        '#Token de confirmação expirado. Por favor, cadastre-se novamente.'
      )
    }

    this.logger.log('Token válido')
    return pending
  }

  /**
   * Confirma um candidato pendente
   * @param pendingCandidateId ID do candidato pendente
   */
  async confirmPendingCandidate(pendingCandidateId: number): Promise<void> {
    this.logger.log(`Confirmando pending candidate: ${pendingCandidateId}`)

    await this.pendingCandidatesRepo.updatePendingConfirmation(
      pendingCandidateId
    )

    this.logger.log(`Pending candidate ${pendingCandidateId} confirmado`)
  }

  /**
   * Busca um candidato pendente por orderCode
   * @param orderCode Código do pedido
   * @returns Candidato pendente ou undefined
   */
  async findPendingByOrderCode(
    orderCode: string
  ): Promise<PendingCandidate | undefined> {
    return this.pendingCandidatesRepo.findPendingByOrderCode(orderCode)
  }

  /**
   * Verifica se orderCode está em pending não confirmado
   * @param orderCode Código do pedido
   * @returns true se existe pending não confirmado, false caso contrário
   */
  async isOrderCodeInPendingCandidates(orderCode: string): Promise<boolean> {
    return this.pendingCandidatesRepo.isOrderCodeInPendingCandidates(orderCode)
  }

  /**
   * Limpa candidatos pendentes expirados
   * Remove registros não confirmados e confirmados antigos
   */
  async cleanupExpiredPendings(): Promise<void> {
    this.logger.log('Iniciando limpeza de candidatos pendentes expirados')

    // Limpar não confirmados
    const unconfirmedHours = Number(
      process.env.CLEANUP_UNCONFIRMED_PENDINGS_AFTER || 24
    )
    const unconfirmedDeleted =
      await this.pendingCandidatesRepo.deleteUnconfirmedPendingsOlderThan(
        unconfirmedHours
      )

    this.logger.log(
      `Deletados ${unconfirmedDeleted} pendings não confirmados com mais de ${unconfirmedHours}h`
    )

    // Limpar confirmados
    const confirmedHours = Number(
      process.env.CLEANUP_CONFIRMED_PENDINGS_AFTER || 48
    )
    const confirmedDeleted =
      await this.pendingCandidatesRepo.deleteConfirmedPendingsOlderThan(
        confirmedHours
      )

    this.logger.log(
      `Deletados ${confirmedDeleted} pendings confirmados com mais de ${confirmedHours}h`
    )

    this.logger.log(
      `Limpeza concluída. Total deletado: ${unconfirmedDeleted + confirmedDeleted}`
    )
  }
}
