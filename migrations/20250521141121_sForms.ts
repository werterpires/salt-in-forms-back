import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.S_FORMS)
  if (hasTable) return
  return knex.schema.createTable(db.Tables.S_FORMS, (table) => {
    table.increments(db.SForms.S_FORM_ID).primary()
    table.string(db.SForms.S_FORM_NAME, 150).notNullable()
    table.string(db.SForms.S_FORM_TYPE, 45).notNullable()
    table
      .integer(db.SForms.PROCESS_ID)
      .unsigned()
      .notNullable()
      .references(db.Processes.PROCESS_ID)
      .inTable(db.Tables.PROCESSES)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.S_FORMS)
}
