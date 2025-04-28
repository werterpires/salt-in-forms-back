import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import * as db from '../constants/db-schema.enum'
import { CreateTerm, Term, TermFilter, UpdateTerm } from './types'
import { Paginator } from 'src/shared/types/types'
import { subtractDays } from './terms.helper'
import { applyFilters } from './terms.helper'

@Injectable()
export class TermsRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}
  elementsPerPage = 20

  async createTerm(
    createTermData: CreateTerm,
    currentTerm?: Term
  ): Promise<number> {
    const { beginDate, roleId, termText, termTypeId } = createTermData

    const termId = await this.knex.transaction(async (trx) => {
      const [termId] = await trx(db.Tables.TERMS).insert({
        [db.Terms.BEGIN_DATE]: beginDate,
        [db.Terms.ROLE_ID]: roleId,
        [db.Terms.TERM_TEXT]: termText,
        [db.Terms.TERM_TYPE_ID]: termTypeId
      })

      if (currentTerm) {
        await trx(db.Tables.TERMS)
          .where(db.Terms.TERM_ID, currentTerm.termId)
          .update({ [db.Terms.END_DATE]: subtractDays(beginDate, 1) })
      }
      return termId
    })

    return termId
  }

  async updateTerm(
    updateTermData: UpdateTerm,
    openTerm?: Term,
    lastTermId?: number
  ) {
    const { beginDate, roleId, termId, termText, termTypeId } = updateTermData

    await this.knex.transaction(async (trx) => {
      if (lastTermId) {
        await trx(db.Tables.TERMS)
          .where(db.Terms.TERM_ID, lastTermId)
          .update({ [db.Terms.END_DATE]: null })
      }

      if (openTerm) {
        await trx(db.Tables.TERMS)
          .where(db.Terms.TERM_ID, openTerm.termId)
          .update({ [db.Terms.END_DATE]: subtractDays(beginDate, 1) })
      }

      await trx(db.Tables.TERMS)
        .where(db.Terms.TERM_ID, termId)
        .update({
          [db.Terms.BEGIN_DATE]: beginDate,
          [db.Terms.ROLE_ID]: roleId,
          [db.Terms.TERM_TEXT]: termText,
          [db.Terms.TERM_TYPE_ID]: termTypeId
        })
    })
  }

  async deleteTerm(termId: number, lastTermId?: number) {
    await this.knex.transaction(async (trx) => {
      await trx(db.Tables.TERMS).where(db.Terms.TERM_ID, termId).delete()

      if (lastTermId) {
        await trx(db.Tables.TERMS)
          .where(db.Terms.TERM_ID, lastTermId)
          .update({ [db.Terms.END_DATE]: null })
      }
    })
  }

  async findTermById(termId: number) {
    const term: Term = await this.knex<Term>(db.Tables.TERMS)
      .select(
        db.Terms.BEGIN_DATE,
        db.Terms.END_DATE,
        db.Terms.ROLE_ID,
        db.Terms.TERM_ID,
        db.Terms.TERM_TEXT,
        db.Terms.TERM_TYPE_ID
      )
      .where(db.Terms.TERM_ID, termId)
      .first()

    return term
  }

  async findCurrentTermByRoleAndType(roleId: number, termTypeId: number) {
    const term: Term | undefined = await this.knex<Term>(db.Tables.TERMS)
      .select(
        db.Terms.BEGIN_DATE,
        db.Terms.END_DATE,
        db.Terms.ROLE_ID,
        db.Terms.TERM_ID,
        db.Terms.TERM_TEXT,
        db.Terms.TERM_TYPE_ID
      )
      .where(db.Terms.ROLE_ID, roleId)
      .andWhere(db.Terms.TERM_TYPE_ID, termTypeId)
      .andWhere(db.Terms.END_DATE, null)
      .first()

    return term
  }

  async findBiggerEndDateTermByRoleAndType(roleId: number, termTypeId: number) {
    const termId: { termId: number } | undefined = await this.knex<Term>(
      db.Tables.TERMS
    )
      .select(db.Terms.TERM_ID)
      .where(db.Terms.ROLE_ID, roleId)
      .andWhere(db.Terms.TERM_TYPE_ID, termTypeId)
      .andWhere(db.Terms.END_DATE, '>=', new Date())
      .orderBy(db.Terms.END_DATE, 'desc')
      .first()

    return termId?.termId || undefined
  }

  async findActiveTermsByRole(roleId: number) {
    const terms: Term[] = await this.knex<Term>(db.Tables.TERMS)
      .select(
        db.Terms.BEGIN_DATE,
        db.Terms.END_DATE,
        db.Terms.ROLE_ID,
        db.Terms.TERM_ID,
        db.Terms.TERM_TEXT,
        db.Terms.TERM_TYPE_ID
      )
      .where(db.Terms.ROLE_ID, roleId)
      .andWhere(db.Terms.END_DATE, '<', new Date())

    return terms
  }

  async findAllTerms(orderBy: Paginator, filters?: TermFilter) {
    const query = this.knex<Term>(db.Tables.TERMS).select(
      db.Terms.BEGIN_DATE,
      db.Terms.END_DATE,
      db.Terms.ROLE_ID,
      db.Terms.TERM_ID,
      db.Terms.TERM_TEXT,
      db.Terms.TERM_TYPE_ID
    )

    if (filters) {
      applyFilters(filters, query)
    }

    if (orderBy) {
      query.orderBy(orderBy.column, orderBy.direction)
    }

    query
      .limit(this.elementsPerPage)
      .offset((orderBy.page - 1 || 0) * this.elementsPerPage)

    const results = await query
    return results
  }

  async findTermsQuantity(filters?: TermFilter) {
    const query = this.knex(db.Tables.TERMS)

    if (filters) {
      applyFilters(filters, query)
    }
    query.countDistinct(db.Terms.TERM_ID)
    const results = await query

    return Math.ceil(results[0]?.count / this.elementsPerPage) || 0
  }
}
