
import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable(db.Tables.MINISTERIALS, (table) => {
    // Remove old columns
    table.dropColumn('ministerialField')
    table.dropColumn('ministerialEmail')
    table.dropColumn('ministerialActive')
    
    // Add new columns
    table.text(db.Ministerials.MINISTERIAL_PRIMARY_PHONE).nullable()
    table.text(db.Ministerials.MINISTERIAL_SECONDARY_PHONE).nullable()
    table.text(db.Ministerials.MINISTERIAL_LANDLINE_PHONE).nullable()
    table.text(db.Ministerials.MINISTERIAL_PRIMARY_EMAIL).nullable()
    table.text(db.Ministerials.MINISTERIAL_ALTERNATIVE_EMAIL).nullable()
    table.text(db.Ministerials.MINISTERIAL_SECRETARY_NAME).nullable()
    table.text(db.Ministerials.MINISTERIAL_SECRETARY_PHONE).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable(db.Tables.MINISTERIALS, (table) => {
    // Remove new columns
    table.dropColumn(db.Ministerials.MINISTERIAL_PRIMARY_PHONE)
    table.dropColumn(db.Ministerials.MINISTERIAL_SECONDARY_PHONE)
    table.dropColumn(db.Ministerials.MINISTERIAL_LANDLINE_PHONE)
    table.dropColumn(db.Ministerials.MINISTERIAL_PRIMARY_EMAIL)
    table.dropColumn(db.Ministerials.MINISTERIAL_ALTERNATIVE_EMAIL)
    table.dropColumn(db.Ministerials.MINISTERIAL_SECRETARY_NAME)
    table.dropColumn(db.Ministerials.MINISTERIAL_SECRETARY_PHONE)
    
    // Restore old columns
    table.string('ministerialField', 150)
    table.string('ministerialEmail', 150)
    table.boolean('ministerialActive').defaultTo(true)
  })
}
