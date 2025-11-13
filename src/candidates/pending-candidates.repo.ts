import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import * as db from '../constants/db-schema.enum'
import {
  PendingCandidate,
  CreatePendingCandidate,
  UpdatePendingCandidate
} from './types'

@Injectable()
export class PendingCandidatesRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  /**
   * Insere um novo candidato pendente
   * @param data Dados do candidato pendente
   * @returns ID do candidato pendente inserido
   */
  async insertPendingCandidate(data: CreatePendingCandidate): Promise<number> {
    const [id] = await this.knex(db.Tables.PENDING_CANDIDATES)
      .insert({
        [db.PendingCandidates.CANDIDATE_NAME]: data.candidateName,
        [db.PendingCandidates.CANDIDATE_EMAIL]: data.candidateEmail,
        [db.PendingCandidates.CANDIDATE_UNIQUE_DOCUMENT]:
          data.candidateUniqueDocument,
        [db.PendingCandidates.CANDIDATE_PHONE]: data.candidatePhone,
        [db.PendingCandidates.ORDER_CODE]: data.orderCode,
        [db.PendingCandidates.PROCESS_ID]: data.processId,
        [db.PendingCandidates.CONFIRMATION_TOKEN]: data.confirmationToken,
        [db.PendingCandidates.TOKEN_EXPIRES_AT]: data.tokenExpiresAt,
        [db.PendingCandidates.ATTEMPT_COUNT]: data.attemptCount || 1
      })
      .returning(db.PendingCandidates.PENDING_CANDIDATE_ID)

    return id
  }

  /**
   * Busca candidato pendente por orderCode
   * Retorna apenas registros não invalidados
   * @param orderCode Código do pedido
   * @returns Candidato pendente ou undefined
   */
  async findPendingByOrderCode(
    orderCode: string
  ): Promise<PendingCandidate | undefined> {
    return this.knex(db.Tables.PENDING_CANDIDATES)
      .select('*')
      .where(db.PendingCandidates.ORDER_CODE, orderCode)
      .whereNull(db.PendingCandidates.INVALIDATED_AT)
      .orderBy(db.PendingCandidates.CREATED_AT, 'desc')
      .first()
  }

  /**
   * Busca candidato pendente por token de confirmação
   * @param token Token de confirmação
   * @returns Candidato pendente ou undefined
   */
  async findPendingByToken(
    token: string
  ): Promise<PendingCandidate | undefined> {
    return this.knex(db.Tables.PENDING_CANDIDATES)
      .select('*')
      .where(db.PendingCandidates.CONFIRMATION_TOKEN, token)
      .first()
  }

  /**
   * Busca candidato pendente por ID
   * @param id ID do candidato pendente
   * @returns Candidato pendente ou undefined
   */
  async findPendingById(id: number): Promise<PendingCandidate | undefined> {
    return this.knex(db.Tables.PENDING_CANDIDATES)
      .select('*')
      .where(db.PendingCandidates.PENDING_CANDIDATE_ID, id)
      .first()
  }

  /**
   * Invalida um token de candidato pendente
   * @param pendingCandidateId ID do candidato pendente
   */
  async invalidatePendingToken(pendingCandidateId: number): Promise<void> {
    await this.knex(db.Tables.PENDING_CANDIDATES)
      .where(db.PendingCandidates.PENDING_CANDIDATE_ID, pendingCandidateId)
      .update({
        [db.PendingCandidates.INVALIDATED_AT]: this.knex.fn.now()
      })
  }

  /**
   * Marca um candidato pendente como confirmado
   * @param pendingCandidateId ID do candidato pendente
   */
  async updatePendingConfirmation(pendingCandidateId: number): Promise<void> {
    await this.knex(db.Tables.PENDING_CANDIDATES)
      .where(db.PendingCandidates.PENDING_CANDIDATE_ID, pendingCandidateId)
      .update({
        [db.PendingCandidates.CONFIRMED_AT]: this.knex.fn.now()
      })
  }

  /**
   * Incrementa o contador de tentativas de um candidato pendente
   * @param pendingCandidateId ID do candidato pendente
   */
  async incrementAttemptCount(pendingCandidateId: number): Promise<void> {
    await this.knex(db.Tables.PENDING_CANDIDATES)
      .where(db.PendingCandidates.PENDING_CANDIDATE_ID, pendingCandidateId)
      .increment(db.PendingCandidates.ATTEMPT_COUNT, 1)
  }

  /**
   * Atualiza dados de um candidato pendente
   * @param data Dados para atualizar
   */
  async updatePendingCandidate(data: UpdatePendingCandidate): Promise<void> {
    const updateData: any = {}

    if (data.confirmationToken !== undefined) {
      updateData[db.PendingCandidates.CONFIRMATION_TOKEN] =
        data.confirmationToken
    }

    if (data.tokenExpiresAt !== undefined) {
      updateData[db.PendingCandidates.TOKEN_EXPIRES_AT] = data.tokenExpiresAt
    }

    if (data.attemptCount !== undefined) {
      updateData[db.PendingCandidates.ATTEMPT_COUNT] = data.attemptCount
    }

    if (data.confirmedAt !== undefined) {
      updateData[db.PendingCandidates.CONFIRMED_AT] = data.confirmedAt
    }

    if (data.invalidatedAt !== undefined) {
      updateData[db.PendingCandidates.INVALIDATED_AT] = data.invalidatedAt
    }

    if (Object.keys(updateData).length > 0) {
      await this.knex(db.Tables.PENDING_CANDIDATES)
        .where(
          db.PendingCandidates.PENDING_CANDIDATE_ID,
          data.pendingCandidateId
        )
        .update(updateData)
    }
  }

  /**
   * Deleta candidatos pendentes não confirmados mais antigos que X horas
   * @param hours Número de horas
   * @returns Número de registros deletados
   */
  async deleteUnconfirmedPendingsOlderThan(hours: number): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - hours)

    return this.knex(db.Tables.PENDING_CANDIDATES)
      .where(db.PendingCandidates.CREATED_AT, '<', cutoffDate)
      .whereNull(db.PendingCandidates.CONFIRMED_AT)
      .delete()
  }

  /**
   * Deleta candidatos pendentes confirmados mais antigos que X horas
   * @param hours Número de horas
   * @returns Número de registros deletados
   */
  async deleteConfirmedPendingsOlderThan(hours: number): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - hours)

    return this.knex(db.Tables.PENDING_CANDIDATES)
      .where(db.PendingCandidates.CONFIRMED_AT, '<', cutoffDate)
      .whereNotNull(db.PendingCandidates.CONFIRMED_AT)
      .delete()
  }

  /**
   * Verifica se orderCode está em pending não confirmado
   * @param orderCode Código do pedido
   * @returns true se existe pending não confirmado, false caso contrário
   */
  async isOrderCodeInPendingCandidates(orderCode: string): Promise<boolean> {
    const result = await this.knex(db.Tables.PENDING_CANDIDATES)
      .count('* as count')
      .where(db.PendingCandidates.ORDER_CODE, orderCode)
      .whereNull(db.PendingCandidates.CONFIRMED_AT)
      .whereNull(db.PendingCandidates.INVALIDATED_AT)
      .first()

    return result ? Number(result.count) > 0 : false
  }

  /**
   * Busca todos os candidatos pendentes não confirmados e não invalidados
   * para um determinado orderCode
   * @param orderCode Código do pedido
   * @returns Lista de candidatos pendentes
   */
  async findActivePendingsByOrderCode(
    orderCode: string
  ): Promise<PendingCandidate[]> {
    return this.knex(db.Tables.PENDING_CANDIDATES)
      .select('*')
      .where(db.PendingCandidates.ORDER_CODE, orderCode)
      .whereNull(db.PendingCandidates.CONFIRMED_AT)
      .whereNull(db.PendingCandidates.INVALIDATED_AT)
      .orderBy(db.PendingCandidates.CREATED_AT, 'desc')
  }
}
