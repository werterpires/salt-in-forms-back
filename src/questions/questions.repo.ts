
import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import * as db from '../constants/db-schema.enum'
import { CreateQuestion, Question, UpdateQuestion } from './types'

@Injectable()
export class QuestionsRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async findAllByFormSectionId(formSectionId: number): Promise<Question[]> {
    return this.knex(db.Tables.QUESTIONS)
      .where(db.Questions.FORM_SECTION_ID, formSectionId)
      .orderBy(db.Questions.QUESTION_ORDER, 'asc')
  }

  async createQuestion(createQuestion: CreateQuestion): Promise<void> {
    await this.knex(db.Tables.QUESTIONS).insert(createQuestion)
  }

  async updateQuestion(updateQuestion: UpdateQuestion): Promise<void> {
    await this.knex(db.Tables.QUESTIONS)
      .where(db.Questions.QUESTION_ID, updateQuestion.questionId)
      .update(updateQuestion)
  }

  async deleteQuestion(questionId: number): Promise<void> {
    return this.knex.transaction(async (trx) => {
      // Buscar a pergunta que será deletada para obter formSectionId e order
      const questionToDelete = await trx(db.Tables.QUESTIONS)
        .where(db.Questions.QUESTION_ID, questionId)
        .first()

      if (!questionToDelete) {
        return
      }

      // Deletar a pergunta
      await trx(db.Tables.QUESTIONS)
        .where(db.Questions.QUESTION_ID, questionId)
        .del()

      // Decrementar a ordem das perguntas com order maior que a pergunta deletada
      await trx(db.Tables.QUESTIONS)
        .where(db.Questions.FORM_SECTION_ID, questionToDelete.formSectionId)
        .andWhere(db.Questions.QUESTION_ORDER, '>', questionToDelete.questionOrder)
        .decrement(db.Questions.QUESTION_ORDER, 1)
    })
  }

  async findById(questionId: number): Promise<Question | null> {
    const question = await this.knex(db.Tables.QUESTIONS)
      .where(db.Questions.QUESTION_ID, questionId)
      .first()
    return question || null
  }

  async createQuestionWithReorder(createQuestion: CreateQuestion): Promise<void> {
    return this.knex.transaction(async (trx) => {
      // Incrementa as ordens das perguntas a partir da ordem desejada
      await trx(db.Tables.QUESTIONS)
        .where(db.Questions.FORM_SECTION_ID, createQuestion.formSectionId)
        .andWhere(db.Questions.QUESTION_ORDER, '>=', createQuestion.questionOrder)
        .increment(db.Questions.QUESTION_ORDER, 1)

      // Cria a nova pergunta
      await trx(db.Tables.QUESTIONS).insert(createQuestion)
    })
  }

  async reorderQuestions(
    questions: { questionId: number; questionOrder: number }[]
  ): Promise<void> {
    await this.knex.transaction(async (trx) => {
      for (const question of questions) {
        await trx(db.Tables.QUESTIONS)
          .where(db.Questions.QUESTION_ID, question.questionId)
          .update({
            [db.Questions.QUESTION_ORDER]: question.questionOrder
          })
      }
    })
  }
}
