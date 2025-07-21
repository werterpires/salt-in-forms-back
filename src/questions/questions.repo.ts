import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { CreateQuestion, UpdateQuestion, Question } from './types'
import * as db from '../constants/db-schema.enum'

@Injectable()
export class QuestionsRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async createQuestion(createQuestionData: CreateQuestion): Promise<void> {
    return this.knex.transaction(async (trx) => {
      // obter id do formulário da seção
      const { sFormId } = await trx(db.Tables.FORM_SECTIONS)
        .where(
          db.FormSections.FORM_SECTION_ID,
          createQuestionData.formSectionId
        )
        .first(db.FormSections.S_FORM_ID)

      // Incrementar a ordem das perguntas com ordem maior ou igual
      await trx(db.Tables.QUESTIONS)
        .join(
          db.Tables.FORM_SECTIONS,
          db.Tables.FORM_SECTIONS + '.' + db.FormSections.FORM_SECTION_ID,
          db.Tables.QUESTIONS + '.' + db.Questions.FORM_SECTION_ID
        )
        .where(db.FormSections.S_FORM_ID, sFormId)
        .andWhere(
          db.Questions.QUESTION_ORDER,
          '>=',
          createQuestionData.questionOrder
        )
        .increment(db.Questions.QUESTION_ORDER, 1)

      // Inserir a nova pergunta
      await trx(db.Tables.QUESTIONS).insert({
        [db.Questions.FORM_SECTION_ID]: createQuestionData.formSectionId,
        [db.Questions.QUESTION_AREA_ID]: createQuestionData.questionAreaId,
        [db.Questions.QUESTION_ORDER]: createQuestionData.questionOrder,
        [db.Questions.QUESTION_TYPE]: createQuestionData.questionType,
        [db.Questions.QUESTION_STATEMENT]: createQuestionData.questionStatement,
        [db.Questions.QUESTION_DESCRIPTION]:
          createQuestionData.questionDescription,
        [db.Questions.QUESTION_DISPLAY_RULE]:
          createQuestionData.questionDisplayRule,
        [db.Questions.FORM_SECTION_DISPLAY_LINK]:
          createQuestionData.formSectionDisplayLink,
        [db.Questions.QUESTION_DISPLAY_LINK]:
          createQuestionData.questionDisplayLink,
        [db.Questions.ANSWER_DISPLEY_RULE]:
          createQuestionData.answerDisplayRule,
        [db.Questions.ANSWER_DISPLAY_VALUE]:
          createQuestionData.answerDisplayValue
      })
    })
  }

  async findAllBySectionId(formSectionId: number): Promise<Question[]> {
    const questions = await this.knex(db.Tables.QUESTIONS)
      .where(db.Questions.FORM_SECTION_ID, formSectionId)
      .orderBy(db.Questions.QUESTION_ORDER, 'asc')

    return questions
  }

  async updateQuestion(updateQuestionData: UpdateQuestion): Promise<void> {
    await this.knex(db.Tables.QUESTIONS)
      .where(db.Questions.QUESTION_ID, updateQuestionData.questionId)
      .update({
        [db.Questions.QUESTION_AREA_ID]: updateQuestionData.questionAreaId,
        [db.Questions.QUESTION_TYPE]: updateQuestionData.questionType,
        [db.Questions.QUESTION_STATEMENT]: updateQuestionData.questionStatement,
        [db.Questions.QUESTION_DESCRIPTION]:
          updateQuestionData.questionDescription,
        [db.Questions.QUESTION_DISPLAY_RULE]:
          updateQuestionData.questionDisplayRule,
        [db.Questions.FORM_SECTION_DISPLAY_LINK]:
          updateQuestionData.formSectionDisplayLink,
        [db.Questions.QUESTION_DISPLAY_LINK]:
          updateQuestionData.questionDisplayLink,
        [db.Questions.ANSWER_DISPLEY_RULE]:
          updateQuestionData.answerDisplayRule,
        [db.Questions.ANSWER_DISPLAY_VALUE]:
          updateQuestionData.answerDisplayValue
      })
  }

  async deleteQuestion(questionId: number): Promise<void> {
    return this.knex.transaction(async (trx) => {
      // Buscar a pergunta que será deletada para obter formSectionId e order
      const questionToDelete = await trx(db.Tables.QUESTIONS)
        .join(
          db.Tables.FORM_SECTIONS,
          db.Tables.FORM_SECTIONS + '.' + db.FormSections.FORM_SECTION_ID,
          db.Tables.QUESTIONS + '.' + db.Questions.FORM_SECTION_ID
        )
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
        .join(
          db.Tables.FORM_SECTIONS,
          db.Tables.FORM_SECTIONS + '.' + db.FormSections.FORM_SECTION_ID,
          db.Tables.QUESTIONS + '.' + db.Questions.FORM_SECTION_ID
        )
        .where(db.FormSections.S_FORM_ID, questionToDelete.sFormId)
        .andWhere(
          db.Questions.QUESTION_ORDER,
          '>',
          questionToDelete.questionOrder
        )
        .decrement(db.Questions.QUESTION_ORDER, 1)
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

  async findById(questionId: number): Promise<Question | null> {
    const question = await this.knex(db.Tables.QUESTIONS)
      .where(db.Questions.QUESTION_ID, questionId)
      .first()

    return question ? question : null
  }

  async findByIds(questionIds: number[]): Promise<Question[]> {
    const questions = await this.knex(db.Tables.QUESTIONS).whereIn(
      db.Questions.QUESTION_ID,
      questionIds
    )

    return questions
  }

  async findSectionById(formSectionId: number) {
    return this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.FORM_SECTION_ID, formSectionId)
      .first()
  }

  async getNumberOfQuestionsFromPreviousSections(
    sectionFormId: number
  ): Promise<number> {
    const { sFormId } = await this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.FORM_SECTION_ID, sectionFormId)
      .first(db.FormSections.S_FORM_ID)

    const { formSectionOrder } = await this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.FORM_SECTION_ID, sectionFormId)
      .first(db.FormSections.FORM_SECTION_ORDER)

    const numberOfQuestions: number = await this.knex(db.Tables.QUESTIONS)
      .join(
        db.Tables.FORM_SECTIONS,
        db.Tables.FORM_SECTIONS + '.' + db.FormSections.FORM_SECTION_ID,
        db.Tables.QUESTIONS + '.' + db.Questions.FORM_SECTION_ID
      )
      .where(db.FormSections.S_FORM_ID, sFormId)
      .andWhere(db.FormSections.FORM_SECTION_ORDER, '<', formSectionOrder)
      .countDistinct({ count: db.Questions.QUESTION_ID })

    return parseInt(numberOfQuestions[0].count, 10) || 0
  }
}
