import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.PENDING_CANDIDATES)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.PENDING_CANDIDATES, (table) => {
    table
      .increments(db.PendingCandidates.PENDING_CANDIDATE_ID)
      .primary()
      .comment('ID único do candidato pendente')

    table
      .string(db.PendingCandidates.CANDIDATE_NAME, 255)
      .notNullable()
      .comment('Nome completo do candidato')

    table
      .text(db.PendingCandidates.CANDIDATE_EMAIL)
      .notNullable()
      .comment('Email do candidato (criptografado)')

    table
      .text(db.PendingCandidates.CANDIDATE_UNIQUE_DOCUMENT)
      .notNullable()
      .comment('CPF/CNPJ do candidato (criptografado)')

    table
      .text(db.PendingCandidates.CANDIDATE_PHONE)
      .notNullable()
      .comment('Telefone do candidato (criptografado)')

    table
      .string(db.PendingCandidates.ORDER_CODE, 50)
      .notNullable()
      .comment('Código único do pedido de inscrição')

    table
      .integer(db.PendingCandidates.PROCESS_ID)
      .unsigned()
      .notNullable()
      .comment('ID do processo seletivo')

    table
      .string(db.PendingCandidates.CONFIRMATION_TOKEN, 100)
      .unique()
      .notNullable()
      .comment('Token único para confirmação de email')

    table
      .datetime(db.PendingCandidates.TOKEN_EXPIRES_AT)
      .notNullable()
      .comment('Data e hora de expiração do token')

    table
      .integer(db.PendingCandidates.ATTEMPT_COUNT)
      .unsigned()
      .defaultTo(1)
      .notNullable()
      .comment('Número de tentativas de cadastro')

    table
      .datetime(db.PendingCandidates.CREATED_AT)
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment('Data e hora de criação do registro')

    table
      .datetime(db.PendingCandidates.CONFIRMED_AT)
      .nullable()
      .comment('Data e hora da confirmação do email')

    table
      .datetime(db.PendingCandidates.INVALIDATED_AT)
      .nullable()
      .comment('Data e hora em que o token foi invalidado')

    // Foreign key
    table
      .foreign(db.PendingCandidates.PROCESS_ID)
      .references(db.Processes.PROCESS_ID)
      .inTable(db.Tables.PROCESSES)
      .onDelete('CASCADE')

    // Índices para otimizar buscas
    table.index(db.PendingCandidates.ORDER_CODE, 'idx_pending_order_code')
    table.index(
      db.PendingCandidates.CONFIRMATION_TOKEN,
      'idx_pending_confirmation_token'
    )
    table.index(
      db.PendingCandidates.TOKEN_EXPIRES_AT,
      'idx_pending_token_expires'
    )
    table.index(db.PendingCandidates.CREATED_AT, 'idx_pending_created_at')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.PENDING_CANDIDATES)
}
