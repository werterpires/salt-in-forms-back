import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { CreateMinisterial, Ministerial, MinisterialsFiltar } from './type'
import * as db from '../constants/db-schema.enum'
import { Paginator } from 'src/shared/types/types'
import { applyFilters } from './ministerials.helper'

@Injectable()
export class MinisterialsRepo {
  elementsPerPage = 20

  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async mergeMinisterials(createMinisterialData: CreateMinisterial[]) {
    const currentActiveMinisterials: Ministerial[] = await this.knex
      .select('*')
      .from(db.Tables.MINISTERIALS)
      .where(db.Ministerials.MINISTERIAL_ACTIVE, true)

    const ministerialsToInsert: CreateMinisterial[] = []
    const ministerialsToInactive: Ministerial[] = []

    createMinisterialData.forEach((ministerial) => {
      if (
        !currentActiveMinisterials.some(
          (m) =>
            m.ministerialName.trim() === ministerial.ministerialName.trim() &&
            m.ministerialField.trim() === ministerial.ministerialField.trim() &&
            m.ministerialEmail.trim() === ministerial.ministerialEmail.trim()
        )
      ) {
        ministerialsToInsert.push(ministerial)
      }
    })

    currentActiveMinisterials.forEach((ministerial) => {
      if (
        ministerialsToInsert.some(
          (m) =>
            m.ministerialField.trim() === ministerial.ministerialField.trim() ||
            m.ministerialEmail.trim() === ministerial.ministerialEmail.trim()
        )
      ) {
        ministerialsToInactive.push(ministerial)
      }
    })

    await this.knex.transaction(async (trx) => {
      for (const ministerial of ministerialsToInactive) {
        await trx(db.Tables.MINISTERIALS)
          .where(db.Ministerials.MINISTERIAL_ID, ministerial.ministerialId)
          .update({ [db.Ministerials.MINISTERIAL_ACTIVE]: false })
      }

      for (const ministerial of ministerialsToInsert) {
        await trx(db.Tables.MINISTERIALS).insert(ministerial)
      }
    })
  }

  async findAllMinisterials(
    orderBy: Paginator<typeof db.Ministerials>,
    filters: MinisterialsFiltar
  ) {
    const query = this.knex(db.Tables.MINISTERIALS).select(
      db.Ministerials.MINISTERIAL_ID,
      db.Ministerials.MINISTERIAL_NAME,
      db.Ministerials.MINISTERIAL_FIELD,
      db.Ministerials.MINISTERIAL_EMAIL,
      db.Ministerials.MINISTERIAL_ACTIVE
    )

    if (filters) {
      applyFilters(filters, query)
    }

    query.orderBy(orderBy.column, orderBy.direction)

    query
      .limit(this.elementsPerPage)
      .offset((orderBy.page - 1 || 0) * this.elementsPerPage)

    return (await query) as Ministerial[]
  }

  async findMinisterialsQuantity(filters?: MinisterialsFiltar) {
    const query = this.knex(db.Tables.MINISTERIALS)

    if (filters) {
      applyFilters(filters, query)
    }

    query.countDistinct(db.Ministerials.MINISTERIAL_ID)
    const [results] = await query
    const countKey = Object.keys(results)[0]
    const count = Number(results[countKey])
    return Math.ceil(count / this.elementsPerPage) || 0
  }
}
