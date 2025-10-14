
import { Knex } from 'knex'
import { MinisterialsFilter, CreateMinisterial, Ministerial, MinisterialQueryResult, MinisterialWithRelations } from './type'
import * as db from '../constants/db-schema.enum'
import { CreateMinisterialDto } from './dto/create-ministerial.dto'

export function applyFilters(
  filters: MinisterialsFilter,
  query: Knex.QueryBuilder
) {
  if (filters.ministerialName) {
    query.where(
      db.Ministerials.MINISTERIAL_NAME,
      'like',
      `%${filters.ministerialName}%`
    )
  }
  if (filters.fieldId !== undefined) {
    query.where(db.Fields.FIELD_ID, filters.fieldId)
  }
  if (filters.unionId !== undefined) {
    query.where(db.Unions.UNION_ID, filters.unionId)
  }
}

export function buildMinisterialData(
  ministerialDto: CreateMinisterialDto,
  fieldId?: number
): CreateMinisterial {
  const data: CreateMinisterial = {
    [db.Ministerials.MINISTERIAL_NAME]: ministerialDto.ministerialName,
    [db.Ministerials.MINISTERIAL_PRIMARY_PHONE]: ministerialDto.ministerialPrimaryPhone || undefined,
    [db.Ministerials.MINISTERIAL_SECONDARY_PHONE]: ministerialDto.ministerialSecondaryPhone || undefined,
    [db.Ministerials.MINISTERIAL_LANDLINE_PHONE]: ministerialDto.ministerialLandlinePhone || undefined,
    [db.Ministerials.MINISTERIAL_PRIMARY_EMAIL]: ministerialDto.ministerialPrimaryEmail || undefined,
    [db.Ministerials.MINISTERIAL_ALTERNATIVE_EMAIL]: ministerialDto.ministerialAlternativeEmail || undefined,
    [db.Ministerials.MINISTERIAL_SECRETARY_NAME]: ministerialDto.ministerialSecretaryName || undefined,
    [db.Ministerials.MINISTERIAL_SECRETARY_PHONE]: ministerialDto.ministerialSecretaryPhone || undefined,
    [db.Ministerials.MINISTERIAL_ACTIVE]: true
  }
  
  if (fieldId !== undefined) {
    data.fieldId = fieldId
  }
  
  return data
}

export function compareMinisterialData(
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

export function processMinisterialResults(results: MinisterialQueryResult[]): MinisterialWithRelations[] {
  const fieldMap = new Map<number, MinisterialWithRelations>()

  for (const row of results) {
    const fieldId = row[db.Fields.FIELD_ID]
    const ministerialId = row[db.Ministerials.MINISTERIAL_ID]

    const existing = fieldMap.get(fieldId)
    
    if (!existing || ministerialId > existing.ministerialId) {
      fieldMap.set(fieldId, {
        ministerialId: row[db.Ministerials.MINISTERIAL_ID],
        ministerialName: row[db.Ministerials.MINISTERIAL_NAME],
        ministerialPrimaryPhone: row[db.Ministerials.MINISTERIAL_PRIMARY_PHONE],
        ministerialSecondaryPhone: row[db.Ministerials.MINISTERIAL_SECONDARY_PHONE],
        ministerialLandlinePhone: row[db.Ministerials.MINISTERIAL_LANDLINE_PHONE],
        ministerialPrimaryEmail: row[db.Ministerials.MINISTERIAL_PRIMARY_EMAIL],
        ministerialAlternativeEmail: row[db.Ministerials.MINISTERIAL_ALTERNATIVE_EMAIL],
        ministerialSecretaryName: row[db.Ministerials.MINISTERIAL_SECRETARY_NAME],
        ministerialSecretaryPhone: row[db.Ministerials.MINISTERIAL_SECRETARY_PHONE],
        field: {
          fieldId: row[db.Fields.FIELD_ID],
          fieldName: row[db.Fields.FIELD_NAME],
          fieldAcronym: row[db.Fields.FIELD_ACRONYM]
        },
        union: {
          unionId: row[db.Unions.UNION_ID],
          unionName: row[db.Unions.UNION_NAME],
          unionAcronym: row[db.Unions.UNION_ACRONYM]
        }
      })
    }
  }

  return Array.from(fieldMap.values())
}
