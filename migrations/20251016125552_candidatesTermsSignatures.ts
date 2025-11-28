import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(
    db.Tables.CANDIDATES_TERMS_SIGNATURES
  )
  if (hasTable) return

  return knex.schema.createTable(
    db.Tables.CANDIDATES_TERMS_SIGNATURES,
    (table) => {
      table
        .increments(db.CandidatesTermsSignatures.CANDIDATE_TERM_SIGNATURE_ID)
        .primary()
      table
        .integer(db.CandidatesTermsSignatures.FORM_CANDIDATE_ID)
        .unsigned()
        .notNullable()
        .references(db.FormsCandidates.FORM_CANDIDATE_ID)
        .inTable(db.Tables.FORMS_CANDIDATES)
        .onDelete('RESTRICT')
        .onUpdate('CASCADE')
      table
        .integer(db.CandidatesTermsSignatures.TERM_ID)
        .unsigned()
        .notNullable()
        .references(db.Terms.TERM_ID)
        .inTable(db.Tables.TERMS)
        .onDelete('RESTRICT')
        .onUpdate('CASCADE')
      table.dateTime(db.CandidatesTermsSignatures.TERM_UNSIGNED)
      table.timestamps(true, true)
    }
  )
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.CANDIDATES_TERMS_SIGNATURES)
}
