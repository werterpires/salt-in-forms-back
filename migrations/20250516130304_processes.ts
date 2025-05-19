import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.PROCESSES)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.PROCESSES, (table) => {
    table.increments(db.Processes.PROCESS_ID).primary()
    table.string(db.Processes.PROCESS_TITLE, 150).notNullable().unique()
    table.string(db.Processes.PROCESS_TOTVS_ID, 255).notNullable().unique()
    table.date(db.Processes.PROCESS_BEGIN_DATE).notNullable()
    table.date(db.Processes.PROCESS_END_DATE)
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.PROCESSES)
}
