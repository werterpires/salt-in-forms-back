import type { Knex } from 'knex'
import { Tables } from '../src/constants/db-schema.enum'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(Tables.RATES, (table) => {
    table.increments('rateId').primary()
    table
      .integer('candidateId')
      .unsigned()
      .notNullable()
      .references('candidateId')
      .inTable(Tables.CANDIDATES)
      .onDelete('CASCADE')
      .onUpdate('CASCADE')

    table
      .integer('interviewerId')
      .unsigned()
      .notNullable()
      .references('userId')
      .inTable(Tables.USERS)
      .onDelete('CASCADE')
      .onUpdate('CASCADE')

    table
      .integer('questionAreaId')
      .unsigned()
      .notNullable()
      .references('questionAreaId')
      .inTable(Tables.QUESTIONS_AREAS)
      .onDelete('CASCADE')
      .onUpdate('CASCADE')

    table.integer('rateValue', 3).nullable()

    table.text('rateComment').nullable()

    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(Tables.RATES)
}
