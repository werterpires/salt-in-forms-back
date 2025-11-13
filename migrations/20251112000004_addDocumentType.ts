import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  // Adicionar em PendingCandidates
  const hasPendingColumn = await knex.schema.hasColumn(
    db.Tables.PENDING_CANDIDATES,
    db.PendingCandidates.CANDIDATE_DOCUMENT_TYPE
  )

  if (!hasPendingColumn) {
    await knex.schema.alterTable(db.Tables.PENDING_CANDIDATES, (table) => {
      table
        .enum(db.PendingCandidates.CANDIDATE_DOCUMENT_TYPE, [
          'CPF',
          'PASSPORT',
          'OTHER'
        ])
        .notNullable()
        .defaultTo('CPF')
        .comment('Tipo de documento do candidato')
        .after(db.PendingCandidates.CANDIDATE_EMAIL)
    })
  }

  // Adicionar em Candidates
  const hasCandidateColumn = await knex.schema.hasColumn(
    db.Tables.CANDIDATES,
    db.Candidates.CANDIDATE_DOCUMENT_TYPE
  )

  if (!hasCandidateColumn) {
    await knex.schema.alterTable(db.Tables.CANDIDATES, (table) => {
      table
        .enum(db.Candidates.CANDIDATE_DOCUMENT_TYPE, [
          'CPF',
          'PASSPORT',
          'OTHER'
        ])
        .notNullable()
        .defaultTo('CPF')
        .comment('Tipo de documento do candidato')
        .after(db.Candidates.CANDIDATE_EMAIL)
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(db.Tables.PENDING_CANDIDATES, (table) => {
    table.dropColumn(db.PendingCandidates.CANDIDATE_DOCUMENT_TYPE)
  })

  await knex.schema.alterTable(db.Tables.CANDIDATES, (table) => {
    table.dropColumn(db.Candidates.CANDIDATE_DOCUMENT_TYPE)
  })
}
