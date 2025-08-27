import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.SUB_VALIDATIONS)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.SUB_VALIDATIONS, (table) => {
    table.increments(db.SubValidations.SUB_VALIDATION_ID).primary()
    table
      .integer(db.SubValidations.SUB_VALIDATION_TYPE)
      .notNullable()
      .unsigned()
    table
      .integer(db.SubValidations.SUB_QUESTION_ID)
      .unsigned()
      .notNullable()
      .references(db.SubQuestions.SUB_QUESTION_ID)
      .inTable(db.Tables.SUB_QUESTIONS)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.string(db.SubValidations.SUB_VALUE_ONE, 255).nullable()
    table.string(db.SubValidations.SUB_VALUE_TWO, 255).nullable()
    table.string(db.SubValidations.SUB_VALUE_THREE, 255).nullable()
    table.string(db.SubValidations.SUB_VALUE_FOUR, 255).nullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {}
