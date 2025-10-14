import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.MINISTERIALS)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.MINISTERIALS, (table) => {
    table.increments(db.Ministerials.MINISTERIAL_ID).primary()
    table.string(db.Ministerials.MINISTERIAL_NAME, 255).notNullable()
    table.text(db.Ministerials.MINISTERIAL_PRIMARY_PHONE).nullable()
    table.text(db.Ministerials.MINISTERIAL_SECONDARY_PHONE).nullable()
    table.text(db.Ministerials.MINISTERIAL_LANDLINE_PHONE).nullable()
    table.text(db.Ministerials.MINISTERIAL_PRIMARY_EMAIL).nullable()
    table.text(db.Ministerials.MINISTERIAL_ALTERNATIVE_EMAIL).nullable()
    table.text(db.Ministerials.MINISTERIAL_SECRETARY_NAME).nullable()
    table.text(db.Ministerials.MINISTERIAL_SECRETARY_PHONE).nullable()
    table
      .integer(db.Ministerials.FIELD_ID)
      .unsigned()
      .notNullable()
      .references(db.Fields.FIELD_ID)
      .inTable(db.Tables.FIELDS)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
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
