import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasOldColumn = await knex.schema.hasColumn(
    db.Tables.PROCESSES,
    'processTotvsId'
  )

  if (!hasOldColumn) return

  return knex.schema.alterTable(db.Tables.PROCESSES, (table) => {
    table.renameColumn('processTotvsId', db.Processes.PROCESS_DATA_KEY)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable(db.Tables.PROCESSES, (table) => {
    table.renameColumn(db.Processes.PROCESS_DATA_KEY, 'processTotvsId')
  })
}
