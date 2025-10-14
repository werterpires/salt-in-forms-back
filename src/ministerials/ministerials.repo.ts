import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { CreateUnion, CreateField, CreateMinisterial, Union, Field, Ministerial } from './type'
import * as db from '../constants/db-schema.enum'

@Injectable()
export class MinisterialsRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async findUnionByNameOrAcronym(
    unionName: string,
    unionAcronym: string
  ): Promise<Union | undefined> {
    return this.knex(db.Tables.UNIONS)
      .where(db.Unions.UNION_NAME, unionName)
      .orWhere(db.Unions.UNION_ACRONYM, unionAcronym)
      .first()
  }

  async createUnion(union: CreateUnion): Promise<number> {
    const [unionId] = await this.knex(db.Tables.UNIONS).insert(union)
    return unionId
  }

  async findFieldByNameOrAcronym(
    fieldName: string,
    fieldAcronym: string
  ): Promise<Field | undefined> {
    return this.knex(db.Tables.FIELDS)
      .where(db.Fields.FIELD_NAME, fieldName)
      .orWhere(db.Fields.FIELD_ACRONYM, fieldAcronym)
      .first()
  }

  async createField(field: CreateField): Promise<number> {
    const [fieldId] = await this.knex(db.Tables.FIELDS).insert(field)
    return fieldId
  }

  async findMinisterialByName(ministerialName: string): Promise<Ministerial | undefined> {
    return this.knex(db.Tables.MINISTERIALS)
      .where(db.Ministerials.MINISTERIAL_NAME, ministerialName)
      .first()
  }

  async findAllMinisterialsByName(ministerialName: string): Promise<Ministerial[]> {
    return this.knex(db.Tables.MINISTERIALS)
      .where(db.Ministerials.MINISTERIAL_NAME, ministerialName)
  }

  async createMinisterial(ministerial: CreateMinisterial): Promise<number> {
    const [ministerialId] = await this.knex(db.Tables.MINISTERIALS).insert(ministerial)
    return ministerialId
  }

  async findAllMinisterials(
    paginator: any,
    filters: any
  ): Promise<any[]> {
    const query = this.knex(db.Tables.MINISTERIALS)
      .select(
        `${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_ID}`,
        `${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_NAME}`,
        `${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_PRIMARY_PHONE}`,
        `${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_SECONDARY_PHONE}`,
        `${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_LANDLINE_PHONE}`,
        `${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_PRIMARY_EMAIL}`,
        `${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_ALTERNATIVE_EMAIL}`,
        `${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_SECRETARY_NAME}`,
        `${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_SECRETARY_PHONE}`,
        `${db.Tables.FIELDS}.${db.Fields.FIELD_ID}`,
        `${db.Tables.FIELDS}.${db.Fields.FIELD_NAME}`,
        `${db.Tables.FIELDS}.${db.Fields.FIELD_ACRONYM}`,
        `${db.Tables.UNIONS}.${db.Unions.UNION_ID}`,
        `${db.Tables.UNIONS}.${db.Unions.UNION_NAME}`,
        `${db.Tables.UNIONS}.${db.Unions.UNION_ACRONYM}`
      )
      .innerJoin(
        db.Tables.FIELDS,
        `${db.Tables.MINISTERIALS}.fieldId`,
        `${db.Tables.FIELDS}.${db.Fields.FIELD_ID}`
      )
      .innerJoin(
        db.Tables.UNIONS,
        `${db.Tables.FIELDS}.${db.Fields.UNION_ID}`,
        `${db.Tables.UNIONS}.${db.Unions.UNION_ID}`
      )

    if (filters.ministerialName) {
      query.where(
        `${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_NAME}`,
        'like',
        `%${filters.ministerialName}%`
      )
    }
    if (filters.fieldId !== undefined) {
      query.where(`${db.Tables.FIELDS}.${db.Fields.FIELD_ID}`, filters.fieldId)
    }
    if (filters.unionId !== undefined) {
      query.where(`${db.Tables.UNIONS}.${db.Unions.UNION_ID}`, filters.unionId)
    }

    query.orderBy(paginator.column, paginator.direction)

    const elementsPerPage = 20
    query
      .limit(elementsPerPage)
      .offset((paginator.page - 1 || 0) * elementsPerPage)

    return await query
  }

  async findMinisterialsQuantity(filters: any): Promise<number> {
    const query = this.knex(db.Tables.MINISTERIALS)
      .innerJoin(
        db.Tables.FIELDS,
        `${db.Tables.MINISTERIALS}.fieldId`,
        `${db.Tables.FIELDS}.${db.Fields.FIELD_ID}`
      )
      .innerJoin(
        db.Tables.UNIONS,
        `${db.Tables.FIELDS}.${db.Fields.UNION_ID}`,
        `${db.Tables.UNIONS}.${db.Unions.UNION_ID}`
      )

    if (filters.ministerialName) {
      query.where(
        `${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_NAME}`,
        'like',
        `%${filters.ministerialName}%`
      )
    }
    if (filters.fieldId !== undefined) {
      query.where(`${db.Tables.FIELDS}.${db.Fields.FIELD_ID}`, filters.fieldId)
    }
    if (filters.unionId !== undefined) {
      query.where(`${db.Tables.UNIONS}.${db.Unions.UNION_ID}`, filters.unionId)
    }

    query.countDistinct(`${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_ID}`)
    const [results] = await query

    const countKey = Object.keys(results)[0]
    const count = Number(results[countKey])
    const elementsPerPage = 20
    return Math.ceil(count / elementsPerPage) || 0
  }
}