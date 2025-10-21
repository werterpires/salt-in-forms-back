
import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import * as db from '../constants/db-schema.enum'
import { Answer, CreateAnswer } from './types'

@Injectable()
export class AnswersRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async findAnswerByQuestionAndFormCandidate(
    questionId: number,
    formCandidateId: number
  ): Promise<Answer | undefined> {
    return this.knex(db.Tables.ANSWERS)
      .select(
        db.Answers.ANSWER_ID,
        db.Answers.QUESTION_ID,
        db.Answers.FORM_CANDIDATE_ID,
        db.Answers.ANSWER_VALUE,
        db.Answers.VALID_ANSWER
      )
      .where(db.Answers.QUESTION_ID, questionId)
      .where(db.Answers.FORM_CANDIDATE_ID, formCandidateId)
      .first()
  }

  async insertAnswer(answer: CreateAnswer): Promise<number> {
    const [insertedId] = await this.knex(db.Tables.ANSWERS).insert({
      [db.Answers.QUESTION_ID]: answer.questionId,
      [db.Answers.FORM_CANDIDATE_ID]: answer.formCandidateId,
      [db.Answers.ANSWER_VALUE]: answer.answerValue,
      [db.Answers.VALID_ANSWER]: answer.validAnswer
    })

    return insertedId
  }

  async updateAnswerValue(answerId: number, answerValue: string): Promise<void> {
    await this.knex(db.Tables.ANSWERS)
      .where(db.Answers.ANSWER_ID, answerId)
      .update({
        [db.Answers.ANSWER_VALUE]: answerValue
      })
  }
}
