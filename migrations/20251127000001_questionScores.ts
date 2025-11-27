import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  // Create question_scores table
  await knex.schema.createTable(db.Tables.QUESTION_SCORES, (table) => {
    table.increments(db.QuestionScores.QUESTION_SCORE_ID).primary()

    table
      .integer(db.QuestionScores.QUESTION_ID)
      .unsigned()
      .notNullable()
      .unique()
      .references(db.Questions.QUESTION_ID)
      .inTable(db.Tables.QUESTIONS)
      .onDelete('CASCADE')
      .onUpdate('CASCADE')

    table
      .enum(db.QuestionScores.SCORE_TYPE, ['OPTION_BASED', 'DATE_BASED'])
      .notNullable()

    table.jsonb(db.QuestionScores.OPTION_SCORES_JSON).nullable()

    table
      .enum(db.QuestionScores.DATE_COMPARISON_TYPE, ['BEFORE', 'ON_OR_AFTER'])
      .nullable()

    table.date(db.QuestionScores.CUTOFF_DATE).nullable()

    table.decimal(db.QuestionScores.DATE_SCORE, 10, 2).nullable()

    table.timestamps(true, true)
  })

  // Add cutoffScore to processes table
  await knex.schema.table(db.Tables.PROCESSES, (table) => {
    table.decimal(db.Processes.CUTOFF_SCORE, 10, 2).nullable()
  })

  // Add approved to candidates table
  await knex.schema.table(db.Tables.CANDIDATES, (table) => {
    table.boolean(db.Candidates.APPROVED).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  // Remove approved from candidates
  await knex.schema.table(db.Tables.CANDIDATES, (table) => {
    table.dropColumn(db.Candidates.APPROVED)
  })

  // Remove cutoffScore from processes
  await knex.schema.table(db.Tables.PROCESSES, (table) => {
    table.dropColumn(db.Processes.CUTOFF_SCORE)
  })

  // Drop question_scores table
  await knex.schema.dropTableIfExists(db.Tables.QUESTION_SCORES)
}
