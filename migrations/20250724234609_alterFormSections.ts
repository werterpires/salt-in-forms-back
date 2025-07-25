import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  return await knex.schema.alterTable(db.Tables.FORM_SECTIONS, (table) => {
    table
      .integer(db.FormSections.QUESTION_DISPLAY_LINK)
      .unsigned()
      .references(db.Questions.QUESTION_ID)
      .inTable(db.Tables.QUESTIONS)
      .onDelete('CASCADE')
      .onUpdate('CASCADE')

    table.integer(db.FormSections.ANSWER_DISPLEY_RULE).unsigned()
    table.text(db.FormSections.ANSWER_DISPLAY_VALUE)
  })
}

export async function down(knex: Knex): Promise<void> {
  return await knex.schema.alterTable(db.Tables.FORM_SECTIONS, (table) => {
    table.dropColumn(db.FormSections.QUESTION_DISPLAY_LINK)
    table.dropColumn(db.FormSections.ANSWER_DISPLEY_RULE)
    table.dropColumn(db.FormSections.ANSWER_DISPLAY_VALUE)
  })
}
