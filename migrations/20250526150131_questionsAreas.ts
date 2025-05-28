import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.QUESTIONS_AREAS)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.QUESTIONS_AREAS, (table) => {
    table.increments(db.QuestionsAreas.QUESTION_AREA_ID).primary()
    table
      .string(db.QuestionsAreas.QUESTION_AREA_NAME, 45)
      .notNullable()
      .unique()
    table.string(db.QuestionsAreas.QUESTION_AREA_DESCRIPTION, 150).notNullable()
    table
      .boolean(db.QuestionsAreas.QUESTION_AREA_ACTIVE)
      .defaultTo(true)
      .notNullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.QUESTIONS_AREAS)
}
