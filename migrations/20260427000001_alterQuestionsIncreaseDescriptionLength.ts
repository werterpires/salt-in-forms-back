import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(db.Tables.QUESTIONS, (table) => {
    table.string(db.Questions.QUESTION_DESCRIPTION, 400).notNullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(db.Tables.QUESTIONS, (table) => {
    table.string(db.Questions.QUESTION_DESCRIPTION, 255).notNullable().alter()
  })
}
