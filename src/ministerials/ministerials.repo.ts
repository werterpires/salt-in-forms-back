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

  compareMinisterialData(
    existing: Ministerial,
    newData: CreateMinisterial
  ): boolean {
    return (
      (existing.ministerialPrimaryPhone || undefined) === (newData.ministerialPrimaryPhone || undefined) &&
      (existing.ministerialSecondaryPhone || undefined) === (newData.ministerialSecondaryPhone || undefined) &&
      (existing.ministerialLandlinePhone || undefined) === (newData.ministerialLandlinePhone || undefined) &&
      (existing.ministerialPrimaryEmail || undefined) === (newData.ministerialPrimaryEmail || undefined) &&
      (existing.ministerialAlternativeEmail || undefined) === (newData.ministerialAlternativeEmail || undefined) &&
      (existing.ministerialSecretaryName || undefined) === (newData.ministerialSecretaryName || undefined) &&
      (existing.ministerialSecretaryPhone || undefined) === (newData.ministerialSecretaryPhone || undefined)
    )
  }
}