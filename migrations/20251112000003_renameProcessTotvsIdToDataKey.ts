import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasOldColumn = await knex.schema.hasColumn(
    db.Tables.PROCESSES,
    'process_totvs_id'
  )

  if (!hasOldColumn) return

  await knex.schema.alterTable(db.Tables.PROCESSES, (table) => {
    table.dropIndex(['process_totvs_id'], 'processes_processtotvsid_unique')

    table.dropColumn('process_totvs_id')

    table.string(db.Processes.PROCESS_DATA_KEY, 255).notNullable().unique()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(db.Tables.PROCESSES, (table) => {
    table.dropUnique([db.Processes.PROCESS_DATA_KEY])

    table.dropColumn(db.Processes.PROCESS_DATA_KEY)

    table.string('process_totvs_id', 255).notNullable().unique()
  })
}
