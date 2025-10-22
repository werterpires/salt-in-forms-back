import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  return await knex.schema.alterTable(db.Tables.S_FORMS, (table) => {
    table
      .integer(db.SForms.EMAIL_QUESTION_ID)
      .nullable()
      .unsigned()
      .references(db.Questions.QUESTION_ID)
      .inTable(db.Tables.QUESTIONS)
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return await knex.schema.alterTable(db.Tables.S_FORMS, (table) => {
    table.dropForeign(
      [db.SForms.EMAIL_QUESTION_ID],
      'sforms_emailquestionid_foreign'
    )
    table.dropColumn(db.SForms.EMAIL_QUESTION_ID)
  })
}
