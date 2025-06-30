import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.QUESTIONS)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.QUESTIONS, (table) => {
    table.increments(db.Questions.QUESTION_ID).primary()
    table
      .integer(db.Questions.FORM_SECTION_ID)
      .unsigned()
      .notNullable()
      .references(db.FormSections.FORM_SECTION_ID)
      .inTable(db.Tables.FORM_SECTIONS)
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
    table
      .integer(db.Questions.QUESTION_AREA_ID)
      .unsigned()
      .notNullable()
      .references(db.QuestionsAreas.QUESTION_AREA_ID)
      .inTable(db.Tables.QUESTIONS_AREAS)
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
    table.integer(db.Questions.QUESTION_ORDER).notNullable().unsigned()
    table.integer(db.Questions.QUESTION_TYPE).notNullable().unsigned()
    table.string(db.Questions.QUESTION_STATEMENT, 255).notNullable()
    table.string(db.Questions.QUESTION_DESCRIPTION, 255).notNullable()
    table.integer(db.Questions.QUESTION_DISPLAY_RULE).notNullable()
    table
      .integer(db.FormSections.FORM_SECTION_DISPLAY_RULE)
      .unsigned()
      .nullable()
      .references(db.FormSections.FORM_SECTION_ID)
      .inTable(db.Tables.FORM_SECTIONS)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table
      .integer(db.Questions.QUESTION_DISPLAY_LINK)
      .unsigned()
      .nullable()
      .references(db.Questions.QUESTION_ID)
      .inTable(db.Tables.QUESTIONS)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.integer(db.Questions.ANSWER_DISPLEY_RULE).nullable()
    table.text(db.Questions.ANSWER_DISPLAY_VALUE).nullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.QUESTIONS)
}
