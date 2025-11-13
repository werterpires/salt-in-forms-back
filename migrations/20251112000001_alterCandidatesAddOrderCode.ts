import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn(
    db.Tables.CANDIDATES,
    db.Candidates.CANDIDATE_ORDER_CODE
  )

  if (hasColumn) return

  return knex.schema.alterTable(db.Tables.CANDIDATES, (table) => {
    table
      .string(db.Candidates.CANDIDATE_ORDER_CODE, 50)
      .unique()
      .nullable()
      .comment('Código único do pedido de inscrição validado na API externa')

    table
      .datetime(db.Candidates.CANDIDATE_ORDER_CODE_VALIDATED_AT)
      .nullable()
      .comment('Data e hora em que o orderCode foi validado')

    // Criar índice para otimizar buscas
    table.index(db.Candidates.CANDIDATE_ORDER_CODE, 'idx_candidate_order_code')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable(db.Tables.CANDIDATES, (table) => {
    table.dropIndex(
      db.Candidates.CANDIDATE_ORDER_CODE,
      'idx_candidate_order_code'
    )
    table.dropColumn(db.Candidates.CANDIDATE_ORDER_CODE)
    table.dropColumn(db.Candidates.CANDIDATE_ORDER_CODE_VALIDATED_AT)
  })
}
