import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.TERMS)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.TERMS, (table) => {
    table.increments(db.Terms.TERM_ID).primary()
    table.integer(db.Terms.ROLE_ID).unsigned()
    table.integer(db.Terms.TERM_TYPE_ID).unsigned()
    table.text(db.Terms.TERM_TEXT).notNullable()
    table.date(db.Terms.BEGIN_DATE).notNullable()
    table.date(db.Terms.END_DATE)
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.TERMS)
}
