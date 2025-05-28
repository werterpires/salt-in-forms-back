import { QuestionsAreasFilter } from './types'
import { Knex } from 'knex'
import * as db from '../constants/db-schema.enum'

export function applyFilters(
  filters: QuestionsAreasFilter,
  query: Knex.QueryBuilder
) {
  if (filters.questionAreaName) {
    query.where(
      db.QuestionsAreas.QUESTION_AREA_NAME,
      'like',
      `%${filters.questionAreaName}%`
    )
  }
  if (filters.questionAreaActive !== undefined) {
    query.where(
      db.QuestionsAreas.QUESTION_AREA_ACTIVE,
      filters.questionAreaActive
    )
  }
}
