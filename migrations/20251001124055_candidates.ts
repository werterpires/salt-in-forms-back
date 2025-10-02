import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.CANDIDATES)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.CANDIDATES, (table) => {
    table.increments(db.Candidates.CANDIDATE_ID).primary()
    table.text(db.Candidates.CANDIDATE_NAME).notNullable()
    table.text(db.Candidates.CANDIDATE_UNIQUE_DOCUMENT).notNullable()
    table.text(db.Candidates.CANDIDATE_EMAIL).notNullable()
    table.text(db.Candidates.CANDIDATE_PHONE).notNullable()
    table.text(db.Candidates.CANDIDATE_BIRTHDATE).notNullable()
    table.boolean(db.Candidates.CANDIDATE_FOREIGNER).notNullable()
    table.text(db.Candidates.CANDIDATE_ADDRESS).notNullable()
    table.text(db.Candidates.CANDIDATE_ADDRESS_NUMBER).notNullable()
    table.text(db.Candidates.CANDIDATE_DISTRICT).notNullable()
    table.text(db.Candidates.CANDIDATE_CITY).notNullable()
    table.text(db.Candidates.CANDIDATE_STATE).notNullable()
    table.text(db.Candidates.CANDIDATE_ZIP_CODE).notNullable()
    table.text(db.Candidates.CANDIDATE_COUNTRY).notNullable()
    table
      .integer(db.Candidates.PROCESS_ID)
      .unsigned()
      .notNullable()
      .references(db.Processes.PROCESS_ID)
      .inTable(db.Tables.PROCESSES)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table
      .integer(db.Candidates.INTERVIEW_USER_ID)
      .unsigned()
      .nullable()
      .references(db.Users.USER_ID)
      .inTable(db.Tables.USERS)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.CANDIDATES)
}
