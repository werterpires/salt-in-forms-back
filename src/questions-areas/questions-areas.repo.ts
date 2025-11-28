import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import {
  CreateQuestionArea,
  QuestionsAreasFilter,
  UpdateQuestionArea
} from './types'
import * as db from '../constants/db-schema.enum'
import { Paginator } from 'src/shared/types/types'
import { applyFilters } from './questions-areas.helper'

@Injectable()
export class QuestionsAreasRepo {
  elementsPerPage = 20

  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async createQuestionArea(createQuestionAreaDate: CreateQuestionArea) {
    const { questionAreaName, questionAreaDescription } = createQuestionAreaDate

    await this.knex(db.Tables.QUESTIONS_AREAS).insert({
      [db.QuestionsAreas.QUESTION_AREA_NAME]: questionAreaName,
      [db.QuestionsAreas.QUESTION_AREA_DESCRIPTION]: questionAreaDescription
    })
  }

  async findAllQuestionAreas(
    orderBy: Paginator<typeof db.QuestionsAreas>,
    filters: QuestionsAreasFilter
  ) {
    const query = this.knex(db.Tables.QUESTIONS_AREAS).select(
      db.QuestionsAreas.QUESTION_AREA_ID,
      db.QuestionsAreas.QUESTION_AREA_NAME,
      db.QuestionsAreas.QUESTION_AREA_DESCRIPTION,
      db.QuestionsAreas.QUESTION_AREA_ACTIVE
    )

    if (filters) {
      applyFilters(filters, query)
    }

    query.orderBy(orderBy.column, orderBy.direction)

    query
      .limit(this.elementsPerPage)
      .offset((orderBy.page - 1 || 0) * this.elementsPerPage)

    return await query
  }

  async findQuestionsAreasQuantity(filters?: QuestionsAreasFilter) {
    const query = this.knex(db.Tables.QUESTIONS_AREAS)

    if (filters) {
      applyFilters(filters, query)
    }

    query.countDistinct(db.QuestionsAreas.QUESTION_AREA_ID)
    const [results] = await query
    const countKey = Object.keys(results)[0]
    const count = Number(results[countKey])
    return Math.ceil(count / this.elementsPerPage) || 0
  }

  async updateQuestionArea(updateQuestionAreaData: UpdateQuestionArea) {
    const {
      questionAreaId,
      questionAreaName,
      questionAreaDescription,
      questionAreaActive
    } = updateQuestionAreaData

    await this.knex(db.Tables.QUESTIONS_AREAS)
      .where(db.QuestionsAreas.QUESTION_AREA_ID, questionAreaId)
      .update({
        [db.QuestionsAreas.QUESTION_AREA_NAME]: questionAreaName,
        [db.QuestionsAreas.QUESTION_AREA_DESCRIPTION]: questionAreaDescription,
        [db.QuestionsAreas.QUESTION_AREA_ACTIVE]: questionAreaActive
      })
  }

  async deleteQuestionArea(questionAreaId: number) {
    return this.knex
      .delete()
      .from(db.Tables.QUESTIONS_AREAS)
      .where(db.QuestionsAreas.QUESTION_AREA_ID, questionAreaId)
  }
}
