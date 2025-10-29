import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable(db.Tables.ANSWERS, (table) => {
    table.text(db.Answers.ANSWER_VALUE).nullable().alter()
  })
}

export async function down(): Promise<void> {}
