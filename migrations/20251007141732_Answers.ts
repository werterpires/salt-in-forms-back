import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.ANSWERS)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.ANSWERS, (table) => {
    table.increments(db.Answers.ANSWER_ID).primary()
    table
      .integer(db.Answers.QUESTION_ID)
      .unsigned()
      .notNullable()
      .references(db.Questions.QUESTION_ID)
      .inTable(db.Tables.QUESTIONS)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table
      .integer(db.Answers.CANDIDATE_ID)
      .unsigned()
      .notNullable()
      .references(db.Candidates.CANDIDATE_ID)
      .inTable(db.Tables.CANDIDATES)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.text(db.Answers.ANSWER_VALUE).notNullable()
    table.boolean(db.Answers.VALID_ANSWER).notNullable().defaultTo(false)
    table.string(db.Answers.ANSWER_COMMENT, 255).nullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.ANSWERS)
}
