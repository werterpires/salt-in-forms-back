
import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import * as db from '../constants/db-schema.enum'
import { CreateAnswer } from './types'

@Injectable()
export class AnswersRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async insertAnswer(answer: CreateAnswer): Promise<number> {
    const [insertedId] = await this.knex(db.Tables.ANSWERS)
      .insert({
        [db.Answers.QUESTION_ID]: answer.questionId,
        [db.Answers.FORM_CANDIDATE_ID]: answer.formCandidateId,
        [db.Answers.ANSWER_VALUE]: answer.answerValue,
        [db.Answers.VALID_ANSWER]: answer.validAnswer
      })
      .returning(db.Answers.ANSWER_ID)

    return typeof insertedId === 'object'
      ? insertedId[db.Answers.ANSWER_ID]
      : insertedId
  }
}
