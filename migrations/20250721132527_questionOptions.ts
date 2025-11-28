import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.QUESTION_OPTIONS)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.QUESTION_OPTIONS, (table) => {
    table.increments(db.QuestionOptions.QUESTION_OPTION_ID).primary()
    table.string(db.QuestionOptions.QUESTION_OPTION_VALUE, 255).notNullable()
    table
      .integer(db.QuestionOptions.QUESTION_OPTION_TYPE)
      .notNullable()
      .unsigned()
    table
      .integer(db.QuestionOptions.QUESTION_ID)
      .unsigned()
      .notNullable()
      .references(db.Questions.QUESTION_ID)
      .inTable(db.Tables.QUESTIONS)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.QUESTION_OPTIONS)
}
