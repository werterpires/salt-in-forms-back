import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.SUB_QUESTION_OPTIONS)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.SUB_QUESTION_OPTIONS, (table) => {
    table.increments(db.SubQuestionOptions.QUESTION_OPTION_ID).primary()
    table.string(db.SubQuestionOptions.QUESTION_OPTION_VALUE, 255).notNullable()
    table
      .integer(db.SubQuestionOptions.QUESTION_OPTION_TYPE)
      .notNullable()
      .unsigned()
    table
      .integer(db.SubQuestionOptions.QUESTION_ID)
      .unsigned()
      .notNullable()
      .references(db.SubQuestions.SUB_QUESTION_ID)
      .inTable(db.Tables.SUB_QUESTIONS)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.SUB_QUESTION_OPTIONS)
}
