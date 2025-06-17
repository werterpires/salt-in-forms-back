import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.FORM_SECTIONS)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.FORM_SECTIONS, (table) => {
    table.increments(db.FormSections.FORM_SECTION_ID).primary()
    table
      .integer(db.FormSections.S_FORM_ID)
      .unsigned()
      .notNullable()
      .references(db.SForms.S_FORM_ID)
      .inTable(db.Tables.S_FORMS)
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
    table.string(db.FormSections.FORM_SECTION_NAME, 150).notNullable()
    table.integer(db.FormSections.FORM_SECTION_ORDER).notNullable()
    table.integer(db.FormSections.FORM_SECTION_DISPLAY_RULE).notNullable()
    table
      .integer(db.FormSections.FORM_SECTION_DISPLAY_LINK)
      .unsigned()
      .notNullable()
      .references(db.FormSections.FORM_SECTION_ID)
      .inTable(db.Tables.FORM_SECTIONS)
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.FORM_SECTIONS)
}
