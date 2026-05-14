import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { Union, Field, Ministerial } from '../ministerials/type'
import * as db from '../constants/db-schema.enum'
import { FieldWithUnion, FieldsWithMinisterialsFilter } from './type'
import { Paginator } from 'src/shared/types/types'

@Injectable()
export class FieldsRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async findAllUnions(): Promise<Union[]> {
    return this.knex(db.Tables.UNIONS)
      .select(db.Unions.UNION_ID, db.Unions.UNION_NAME, db.Unions.UNION_ACRONYM)
      .limit(1000)
      .orderBy(db.Unions.UNION_NAME, 'asc')
  }

  async findFieldsByUnionId(unionId: number): Promise<Field[]> {
    return this.knex(db.Tables.FIELDS)
      .select(
        db.Fields.FIELD_ID,
        db.Fields.FIELD_NAME,
        db.Fields.FIELD_ACRONYM,
        db.Fields.UNION_ID
      )
      .where(db.Fields.UNION_ID, unionId)
      .orderBy(db.Fields.FIELD_NAME, 'asc')
  }

  async findAllFieldsWithUnions(
    paginator: Paginator<typeof db.Fields>,
    filters: FieldsWithMinisterialsFilter
  ): Promise<FieldWithUnion[]> {
    const query = this.knex(db.Tables.FIELDS)
      .select(
        `${db.Tables.FIELDS}.${db.Fields.FIELD_ID}`,
        `${db.Tables.FIELDS}.${db.Fields.FIELD_NAME}`,
        `${db.Tables.FIELDS}.${db.Fields.FIELD_ACRONYM}`,
        `${db.Tables.UNIONS}.${db.Unions.UNION_ID}`,
        `${db.Tables.UNIONS}.${db.Unions.UNION_NAME}`,
        `${db.Tables.UNIONS}.${db.Unions.UNION_ACRONYM}`
      )
      .innerJoin(
        db.Tables.UNIONS,
        `${db.Tables.FIELDS}.${db.Fields.UNION_ID}`,
        `${db.Tables.UNIONS}.${db.Unions.UNION_ID}`
      )

    if (filters.fieldName) {
      query.where(
        `${db.Tables.FIELDS}.${db.Fields.FIELD_NAME}`,
        'like',
        `%${filters.fieldName}%`
      )
    }
    if (filters.unionId !== undefined) {
      query.where(`${db.Tables.UNIONS}.${db.Unions.UNION_ID}`, filters.unionId)
    }

    query.orderBy(
      `${db.Tables.FIELDS}.${paginator.column}`,
      paginator.direction
    )

    const elementsPerPage = 20
    query
      .limit(elementsPerPage)
      .offset((paginator.page - 1 || 0) * elementsPerPage)

    return await query
  }

  async findFieldsCount(filters: FieldsWithMinisterialsFilter): Promise<number> {
    const query = this.knex(db.Tables.FIELDS).innerJoin(
      db.Tables.UNIONS,
      `${db.Tables.FIELDS}.${db.Fields.UNION_ID}`,
      `${db.Tables.UNIONS}.${db.Unions.UNION_ID}`
    )

    if (filters.fieldName) {
      query.where(
        `${db.Tables.FIELDS}.${db.Fields.FIELD_NAME}`,
        'like',
        `%${filters.fieldName}%`
      )
    }
    if (filters.unionId !== undefined) {
      query.where(`${db.Tables.UNIONS}.${db.Unions.UNION_ID}`, filters.unionId)
    }

    query.countDistinct(`${db.Tables.FIELDS}.${db.Fields.FIELD_ID}`)
    const [result] = await query
    const countKey = Object.keys(result)[0]
    const count = Number(result[countKey])
    const elementsPerPage = 20
    return Math.ceil(count / elementsPerPage) || 0
  }

  async findMinisterialsByFieldIds(fieldIds: number[]): Promise<Ministerial[]> {
    return this.knex(db.Tables.MINISTERIALS)
      .select(
        db.Ministerials.MINISTERIAL_ID,
        db.Ministerials.MINISTERIAL_NAME,
        db.Ministerials.MINISTERIAL_PRIMARY_PHONE,
        db.Ministerials.MINISTERIAL_SECONDARY_PHONE,
        db.Ministerials.MINISTERIAL_LANDLINE_PHONE,
        db.Ministerials.MINISTERIAL_PRIMARY_EMAIL,
        db.Ministerials.MINISTERIAL_ALTERNATIVE_EMAIL,
        db.Ministerials.MINISTERIAL_SECRETARY_NAME,
        db.Ministerials.MINISTERIAL_SECRETARY_PHONE,
        db.Ministerials.MINISTERIAL_ACTIVE,
        db.Ministerials.FIELD_ID
      )
      .whereIn(db.Ministerials.FIELD_ID, fieldIds)
  }
}
