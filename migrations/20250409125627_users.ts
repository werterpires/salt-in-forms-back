import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.USERS)
  console.log(hasTable)
  if (hasTable) return
  return knex.schema.createTable(db.Tables.USERS, (table) => {
    table.increments(db.Users.USER_ID).primary()
    table.string(db.Users.USER_NAME, 150).notNullable()
    table.string(db.Users.USER_CPF)
    table.string(db.Users.USER_EMAIL).notNullable().unique()
    table.string(db.Users.USER_PASSWORD, 60)
    table.string(db.Users.USER_PASSWORD_RECOVER_CODE, 45)
    table.boolean(db.Users.USER_ACTIVE).defaultTo(true).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.USERS)
}
