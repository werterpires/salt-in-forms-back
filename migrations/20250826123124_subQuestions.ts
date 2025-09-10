import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.SUB_QUESTIONS)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.SUB_QUESTIONS, (table) => {
    table.increments(db.SubQuestions.SUB_QUESTION_ID).primary()
    table
      .integer(db.SubQuestions.QUESTION_ID)
      .unsigned()
      .notNullable()
      .references(db.Questions.QUESTION_ID)
      .inTable(db.Tables.QUESTIONS)
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
    table.string(db.SubQuestions.SUB_QUESTION_STATEMENT, 255).notNullable()
    table.integer(db.SubQuestions.SUB_QUESTION_POSITION).notNullable()
    table.integer(db.SubQuestions.SUB_QUESTION_TYPE).notNullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.SUB_QUESTIONS)
}
