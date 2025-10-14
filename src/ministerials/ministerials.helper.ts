import { Knex } from 'knex'
import { MinisterialsFiltar } from './type'
import * as db from '../constants/db-schema.enum'

export function applyFilters(
  filters: MinisterialsFiltar,
  query: Knex.QueryBuilder
) {
  if (filters.ministerialName) {
    query.where(
      db.Ministerials.MINISTERIAL_NAME,
      'like',
      `%${filters.ministerialName}%`
    )
  }
  if (filters.ministerialActive !== undefined) {
    query.where(db.Ministerials.MINISTERIAL_ACTIVE, filters.ministerialActive)
  }
  if (filters.ministerialField) {
    query.where(
      db.Ministerials.MINISTERIAL_FIELD,
      'like',
      `%${filters.ministerialField}%`
    )
  }
  if (filters.ministerialEmail) {
    query.where(
      db.Ministerials.MINISTERIAL_EMAIL,
      'like',
      `%${filters.ministerialEmail}%`
    )
  }
}