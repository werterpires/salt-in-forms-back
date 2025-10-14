import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import {
  CreateUnion,
  CreateField,
  CreateMinisterial,
  Union,
  Field,
  Ministerial,
  CreateMinisterialsTransaction,
  MinisterialsFilter,
  MinisterialQueryResult,
  MinisterialWithRelations
} from './type'
import * as db from '../constants/db-schema.enum'
import { compareMinisterialData } from './ministerials.helper'
import { Paginator } from 'src/shared/types/types'

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

  async findMinisterialByName(
    ministerialName: string
  ): Promise<Ministerial | undefined> {
    return this.knex(db.Tables.MINISTERIALS)
      .where(db.Ministerials.MINISTERIAL_NAME, ministerialName)
      .first()
  }

  async findAllMinisterialsByName(
    ministerialName: string
  ): Promise<Ministerial[]> {
    return this.knex(db.Tables.MINISTERIALS).where(
      db.Ministerials.MINISTERIAL_NAME,
      ministerialName
    )
  }

  async deactivateMinisterialsByField(fieldId: number): Promise<void> {
    await this.knex(db.Tables.MINISTERIALS)
      .where('fieldId', fieldId)
      .update({ [db.Ministerials.MINISTERIAL_ACTIVE]: false })
  }

  async createMinisterial(ministerial: CreateMinisterial): Promise<number> {
    const [ministerialId] = await this.knex(db.Tables.MINISTERIALS).insert(
      ministerial
    )
    return ministerialId
  }

  async findAllMinisterials(
    paginator: Paginator<typeof db.Ministerials>,
    filters: MinisterialsFilter
  ): Promise<MinisterialWithRelations[]> {
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

    if (
      filters.ministerialActive == undefined ||
      filters.ministerialActive == null ||
      filters.ministerialActive == true
    ) {
      query.where(
        `${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_ACTIVE}`,
        true
      )
    }

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

  async findMinisterialsQuantity(filters: MinisterialsFilter): Promise<number> {
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
      .where(
        `${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_ACTIVE}`,
        true
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

    if (
      filters.ministerialActive == undefined ||
      filters.ministerialActive == null ||
      filters.ministerialActive == true
    ) {
      query.where(
        `${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_ACTIVE}`,
        true
      )
    }

    query.countDistinct(
      `${db.Tables.MINISTERIALS}.${db.Ministerials.MINISTERIAL_ID}`
    )
    const [results] = await query

    const countKey = Object.keys(results)[0]
    const count = Number(results[countKey])
    const elementsPerPage = 20
    return Math.ceil(count / elementsPerPage) || 0
  }

  async createMinisterialsWithTransaction(
    data: CreateMinisterialsTransaction
  ): Promise<void> {
    await this.knex.transaction(async (trx) => {
      for (const unionDto of data.unions) {
        // 1. Check if union exists, if not create it
        let union = await trx(db.Tables.UNIONS)
          .where(db.Unions.UNION_NAME, unionDto.unionName)
          .orWhere(db.Unions.UNION_ACRONYM, unionDto.unionAcronym)
          .first()

        let unionId: number
        if (union) {
          unionId = union[db.Unions.UNION_ID]
        } else {
          const [id] = await trx(db.Tables.UNIONS).insert({
            [db.Unions.UNION_NAME]: unionDto.unionName,
            [db.Unions.UNION_ACRONYM]: unionDto.unionAcronym
          })
          unionId = id
        }

        // 2. Process fields
        for (const fieldDto of unionDto.fields) {
          // Check if field exists, if not create it
          let field = await trx(db.Tables.FIELDS)
            .where(db.Fields.FIELD_NAME, fieldDto.fieldName)
            .orWhere(db.Fields.FIELD_ACRONYM, fieldDto.fieldAcronym)
            .first()

          let fieldId: number
          if (field) {
            fieldId = field[db.Fields.FIELD_ID]
          } else {
            const [id] = await trx(db.Tables.FIELDS).insert({
              [db.Fields.FIELD_NAME]: fieldDto.fieldName,
              [db.Fields.FIELD_ACRONYM]: fieldDto.fieldAcronym,
              [db.Fields.UNION_ID]: unionId
            })
            fieldId = id
          }

          // 3. Process ministerial
          const ministerialData = fieldDto.ministerial

          // Check if ministerial with this name exists
          const existingMinisterials = await trx(db.Tables.MINISTERIALS).where(
            db.Ministerials.MINISTERIAL_NAME,
            ministerialData.ministerialName
          )

          const ministerialToInsert = {
            ...ministerialData,
            fieldId
          }

          if (existingMinisterials.length === 0) {
            // Case 1: Name doesn't exist, deactivate others from same field and insert new record
            await trx(db.Tables.MINISTERIALS)
              .where('fieldId', fieldId)
              .update({ [db.Ministerials.MINISTERIAL_ACTIVE]: false })

            await trx(db.Tables.MINISTERIALS).insert(ministerialToInsert)
          } else {
            // Case 2: Name exists, compare data using helper function
            const hasSameData = existingMinisterials.some((existing) =>
              compareMinisterialData(existing, ministerialData)
            )

            if (!hasSameData) {
              // Data is different, deactivate others from same field and insert new record
              await trx(db.Tables.MINISTERIALS)
                .where('fieldId', fieldId)
                .update({ [db.Ministerials.MINISTERIAL_ACTIVE]: false })

              await trx(db.Tables.MINISTERIALS).insert(ministerialToInsert)
            }
            // else: Data is the same, ignore
          }
        }
      }
    })
  }
}
