
import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.UNIONS)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.UNIONS, (table) => {
    table.increments(db.Unions.UNION_ID).primary()
    table.string(db.Unions.UNION_NAME, 255).notNullable()
    table.string(db.Unions.UNION_ACRONYM, 20).notNullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.UNIONS)
}
