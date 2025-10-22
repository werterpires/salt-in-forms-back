import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  return await knex.schema.alterTable(db.Tables.PROCESSES, (table) => {
    table.date(db.Processes.PROCESS_END_ANSWERS).nullable()
    table.date(db.Processes.PROCESS_END_SUBSCRIPTION).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return await knex.schema.alterTable(db.Tables.PROCESSES, (table) => {
    table.dropColumn(db.Processes.PROCESS_END_ANSWERS)
    table.dropColumn(db.Processes.PROCESS_END_SUBSCRIPTION)
  })
}
