
import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.FIELDS)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.FIELDS, (table) => {
    table.increments(db.Fields.FIELD_ID).primary()
    table.string(db.Fields.FIELD_NAME, 255).notNullable()
    table.string(db.Fields.FIELD_ACRONYM, 20).notNullable()
    table
      .integer(db.Fields.UNION_ID)
      .unsigned()
      .notNullable()
      .references(db.Unions.UNION_ID)
      .inTable(db.Tables.UNIONS)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.FIELDS)
}
