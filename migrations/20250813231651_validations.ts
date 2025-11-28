import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.VALIDATIONS)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.VALIDATIONS, (table) => {
    table.increments(db.Validations.VALIDATION_ID).primary()
    table.integer(db.Validations.VALIDATION_TYPE).notNullable().unsigned()
    table
      .integer(db.Validations.QUESTION_ID)
      .unsigned()
      .notNullable()
      .references(db.Questions.QUESTION_ID)
      .inTable(db.Tables.QUESTIONS)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.string(db.Validations.VALUE_ONE, 255).nullable()
    table.string(db.Validations.VALUE_TWO, 255).nullable()
    table.string(db.Validations.VALUE_THREE, 255).nullable()
    table.string(db.Validations.VALUE_FOUR, 255).nullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.VALIDATIONS)
}
