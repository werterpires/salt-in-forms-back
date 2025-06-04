import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.MINISTERIALS)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.MINISTERIALS, (table) => {
    table.increments(db.Ministerials.MINISTERIAL_ID).primary()
    table.string(db.Ministerials.MINISTERIAL_NAME, 150).notNullable()
    table.string(db.Ministerials.MINISTERIAL_FIELD, 150).notNullable()
    table.string(db.Ministerials.MINISTERIAL_EMAIL, 150).notNullable()
    table
      .boolean(db.Ministerials.MINISTERIAL_ACTIVE)
      .defaultTo(true)
      .notNullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.MINISTERIALS)
}
