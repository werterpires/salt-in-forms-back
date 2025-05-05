import type { Knex } from 'knex'
import * as db from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(db.Tables.USERS_ROLES)
  if (hasTable) return

  return knex.schema.createTable(db.Tables.USERS_ROLES, (table) => {
    table.integer(db.UsersRoles.USER_ID).unsigned().notNullable()
    table.integer(db.UsersRoles.ROLE_ID).unsigned().notNullable()
    table.boolean(db.UsersRoles.USER_ROLE_ACTIVE).defaultTo(true).notNullable()
    table.timestamps(true, true)

    table.primary([db.UsersRoles.USER_ID, db.UsersRoles.ROLE_ID])

    table
      .foreign(db.UsersRoles.USER_ID)
      .references(db.Users.USER_ID)
      .inTable(db.Tables.USERS)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(db.Tables.USERS_ROLES)
}
