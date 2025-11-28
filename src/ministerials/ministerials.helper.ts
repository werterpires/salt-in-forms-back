import { Knex } from 'knex'
import { MinisterialsFilter, CreateMinisterial, Ministerial } from './type'
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
    [db.Ministerials.MINISTERIAL_PRIMARY_PHONE]:
      ministerialDto.ministerialPrimaryPhone || undefined,
    [db.Ministerials.MINISTERIAL_SECONDARY_PHONE]:
      ministerialDto.ministerialSecondaryPhone || undefined,
    [db.Ministerials.MINISTERIAL_LANDLINE_PHONE]:
      ministerialDto.ministerialLandlinePhone || undefined,
    [db.Ministerials.MINISTERIAL_PRIMARY_EMAIL]:
      ministerialDto.ministerialPrimaryEmail || undefined,
    [db.Ministerials.MINISTERIAL_ALTERNATIVE_EMAIL]:
      ministerialDto.ministerialAlternativeEmail || undefined,
    [db.Ministerials.MINISTERIAL_SECRETARY_NAME]:
      ministerialDto.ministerialSecretaryName || undefined,
    [db.Ministerials.MINISTERIAL_SECRETARY_PHONE]:
      ministerialDto.ministerialSecretaryPhone || undefined,
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
    (existing.ministerialPrimaryPhone || undefined) ===
      (newData.ministerialPrimaryPhone || undefined) &&
    (existing.ministerialSecondaryPhone || undefined) ===
      (newData.ministerialSecondaryPhone || undefined) &&
    (existing.ministerialLandlinePhone || undefined) ===
      (newData.ministerialLandlinePhone || undefined) &&
    (existing.ministerialPrimaryEmail || undefined) ===
      (newData.ministerialPrimaryEmail || undefined) &&
    (existing.ministerialAlternativeEmail || undefined) ===
      (newData.ministerialAlternativeEmail || undefined) &&
    (existing.ministerialSecretaryName || undefined) ===
      (newData.ministerialSecretaryName || undefined) &&
    (existing.ministerialSecretaryPhone || undefined) ===
      (newData.ministerialSecretaryPhone || undefined)
  )
}

export function buildUpdateMinisterialData(ministerialData: {
  ministerialName: string
  ministerialPrimaryPhone?: string | null
  ministerialSecondaryPhone?: string | null
  ministerialLandlinePhone?: string | null
  ministerialPrimaryEmail?: string | null
  ministerialAlternativeEmail?: string | null
  ministerialSecretaryName?: string | null
  ministerialSecretaryPhone?: string | null
  ministerialActive?: boolean | null
}): Record<string, any> {
  return {
    [db.Ministerials.MINISTERIAL_NAME]: ministerialData.ministerialName,
    [db.Ministerials.MINISTERIAL_PRIMARY_PHONE]:
      ministerialData.ministerialPrimaryPhone ?? undefined,
    [db.Ministerials.MINISTERIAL_SECONDARY_PHONE]:
      ministerialData.ministerialSecondaryPhone ?? undefined,
    [db.Ministerials.MINISTERIAL_LANDLINE_PHONE]:
      ministerialData.ministerialLandlinePhone ?? undefined,
    [db.Ministerials.MINISTERIAL_PRIMARY_EMAIL]:
      ministerialData.ministerialPrimaryEmail ?? undefined,
    [db.Ministerials.MINISTERIAL_ALTERNATIVE_EMAIL]:
      ministerialData.ministerialAlternativeEmail ?? undefined,
    [db.Ministerials.MINISTERIAL_SECRETARY_NAME]:
      ministerialData.ministerialSecretaryName ?? undefined,
    [db.Ministerials.MINISTERIAL_SECRETARY_PHONE]:
      ministerialData.ministerialSecretaryPhone ?? undefined,
    [db.Ministerials.MINISTERIAL_ACTIVE]:
      ministerialData.ministerialActive ?? undefined
  }
}
