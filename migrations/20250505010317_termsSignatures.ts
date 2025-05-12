import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.TERMS_SIGNATURES)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.TERMS_SIGNATURES, (table) => {
    table.increments(db.TermsSignatures.TERM_SIGNATURE_ID).primary()
    table.integer(db.TermsSignatures.TERM_ID).unsigned().notNullable()
    table.integer(db.TermsSignatures.USER_ID).unsigned().notNullable()
    table.dateTime(db.TermsSignatures.TERM_UNSIGNED_TIME)
    table.timestamps(true, true)

    table
      .foreign(db.TermsSignatures.TERM_ID)
      .references(db.Terms.TERM_ID)
      .inTable(db.Tables.TERMS)

    table
      .foreign(db.TermsSignatures.USER_ID)
      .references(db.Users.USER_ID)
      .inTable(db.Tables.USERS)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.TERMS_SIGNATURES)
}
