import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { Union, Field } from '../ministerials/type'
import * as db from '../constants/db-schema.enum'

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
}
