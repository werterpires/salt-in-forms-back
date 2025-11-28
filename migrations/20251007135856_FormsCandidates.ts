import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.FORMS_CANDIDATES)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.FORMS_CANDIDATES, (table) => {
    table.increments(db.FormsCandidates.FORM_CANDIDATE_ID).primary()
    table
      .integer(db.FormsCandidates.CANDIDATE_ID)
      .unsigned()
      .notNullable()
      .references(db.Candidates.CANDIDATE_ID)
      .inTable(db.Tables.CANDIDATES)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table
      .integer(db.FormsCandidates.S_FORM_ID)
      .unsigned()
      .notNullable()
      .references(db.SForms.S_FORM_ID)
      .inTable(db.Tables.S_FORMS)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.integer(db.FormsCandidates.FORM_CANDIDATE_STATUS).notNullable()
    table.text(db.FormsCandidates.FORM_CANDIDATE_ACCESS_CODE).notNullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.FORMS_CANDIDATES)
}
