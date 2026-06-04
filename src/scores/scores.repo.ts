import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import * as db from '../constants/db-schema.enum'
import { IQuestionScore } from '../questions/types/question-score.types'
import { IUpsertScore } from './scores.types'

@Injectable()
export class ScoresRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async upsertScore(data: IUpsertScore): Promise<number> {
    return this.knex.transaction(async (trx) => {
      await trx(db.Tables.QUESTION_SCORES)
        .where(db.QuestionScores.QUESTION_ID, data.questionId)
        .del()

      const [questionScoreId] = await trx(db.Tables.QUESTION_SCORES).insert({
        [db.QuestionScores.QUESTION_ID]: data.questionId,
        [db.QuestionScores.SCORE_TYPE]: data.scoreType,
        [db.QuestionScores.OPTION_SCORES_JSON]: data.optionScoresJson
          ? JSON.stringify(data.optionScoresJson)
          : null,
        [db.QuestionScores.DATE_COMPARISON_TYPE]:
          data.dateComparisonType ?? null,
        [db.QuestionScores.CUTOFF_DATE]: data.cutoffDate ?? null,
        [db.QuestionScores.DATE_SCORE]: data.dateScore ?? null
      })

      return questionScoreId
    })
  }

  async findByQuestionId(questionId: number): Promise<IQuestionScore | null> {
    const score = await this.knex(db.Tables.QUESTION_SCORES)
      .where(db.QuestionScores.QUESTION_ID, questionId)
      .first()

    return score ?? null
  }

  async deleteByQuestionId(questionId: number): Promise<void> {
    await this.knex(db.Tables.QUESTION_SCORES)
      .where(db.QuestionScores.QUESTION_ID, questionId)
      .del()
  }
}
