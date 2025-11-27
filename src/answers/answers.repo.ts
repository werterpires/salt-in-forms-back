import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import * as db from '../constants/db-schema.enum'
import { Answer, CreateAnswer } from './types'

@Injectable()
export class AnswersRepo {
  constructor(@InjectConnection('knexx') public readonly knex: Knex) {}

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

  async updateAnswerValue(
    answerId: number,
    answerValue: string
  ): Promise<void> {
    await this.knex(db.Tables.ANSWERS)
      .where(db.Answers.ANSWER_ID, answerId)
      .update({
        [db.Answers.ANSWER_VALUE]: answerValue
      })
  }

  async findAnswersByQuestionsAndFormCandidate(
    questionIds: number[],
    formCandidateId: number,
    trx?: Knex.Transaction
  ): Promise<Answer[]> {
    return (trx || this.knex)(db.Tables.ANSWERS)
      .select(
        db.Answers.ANSWER_ID,
        db.Answers.QUESTION_ID,
        db.Answers.FORM_CANDIDATE_ID,
        db.Answers.ANSWER_VALUE,
        db.Answers.VALID_ANSWER
      )
      .whereIn(db.Answers.QUESTION_ID, questionIds)
      .where(db.Answers.FORM_CANDIDATE_ID, formCandidateId)
  }

  async updateAnswerValidAnswer(
    answerId: number,
    validAnswer: boolean,
    trx?: Knex.Transaction
  ): Promise<void> {
    await (trx || this.knex)(db.Tables.ANSWERS)
      .where(db.Answers.ANSWER_ID, answerId)
      .update({
        [db.Answers.VALID_ANSWER]: validAnswer
      })
  }

  async findAllAnswersByFormCandidateId(
    formCandidateId: number
  ): Promise<Answer[]> {
    return this.knex(db.Tables.ANSWERS)
      .select(
        db.Answers.ANSWER_ID,
        db.Answers.QUESTION_ID,
        db.Answers.FORM_CANDIDATE_ID,
        db.Answers.ANSWER_VALUE,
        db.Answers.VALID_ANSWER
      )
      .where(db.Answers.FORM_CANDIDATE_ID, formCandidateId)
  }

  async insertAnswerInTransaction(
    answer: CreateAnswer,
    trx: Knex.Transaction
  ): Promise<number> {
    const [insertedId] = await trx(db.Tables.ANSWERS).insert({
      [db.Answers.QUESTION_ID]: answer.questionId,
      [db.Answers.FORM_CANDIDATE_ID]: answer.formCandidateId,
      [db.Answers.ANSWER_VALUE]: answer.answerValue,
      [db.Answers.VALID_ANSWER]: answer.validAnswer
    })

    return insertedId
  }

  async updateAnswerValueInTransaction(
    answerId: number,
    answerValue: string,
    trx: Knex.Transaction
  ): Promise<void> {
    await trx(db.Tables.ANSWERS)
      .where(db.Answers.ANSWER_ID, answerId)
      .update({
        [db.Answers.ANSWER_VALUE]: answerValue
      })
  }

  async findEmailAnswersByCandidateId(
    candidateId: number,
    excludeFormCandidateId?: number
  ): Promise<Answer[]> {
    const query = this.knex(db.Tables.ANSWERS)
      .select(
        db.Answers.ANSWER_ID,
        db.Answers.QUESTION_ID,
        db.Answers.FORM_CANDIDATE_ID,
        db.Answers.ANSWER_VALUE,
        db.Answers.VALID_ANSWER
      )
      .innerJoin(
        db.Tables.FORMS_CANDIDATES,
        `${db.Tables.ANSWERS}.${db.Answers.FORM_CANDIDATE_ID}`,
        '=',
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.FORM_CANDIDATE_ID}`
      )
      .innerJoin(
        db.Tables.QUESTIONS,
        `${db.Tables.ANSWERS}.${db.Answers.QUESTION_ID}`,
        '=',
        `${db.Tables.QUESTIONS}.${db.Questions.QUESTION_ID}`
      )
      .where(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.CANDIDATE_ID}`,
        candidateId
      )
      .andWhere(`${db.Tables.QUESTIONS}.${db.Questions.QUESTION_TYPE}`, 10) // EMAIL type

    if (excludeFormCandidateId) {
      query.andWhere(
        `${db.Tables.ANSWERS}.${db.Answers.FORM_CANDIDATE_ID}`,
        '!=',
        excludeFormCandidateId
      )
    }

    return query
  }
}
