import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import {
  Question,
  CreateQuestion,
  UpdateQuestion,
  QuestionOption
} from './types'
import * as db from '../constants/db-schema.enum'

@Injectable()
export class QuestionsRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async create(createQuestionData: CreateQuestion): Promise<number> {
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
      const [questionId] = await trx(db.Tables.QUESTIONS).insert({
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

      // Inserir validações, se houver
      if (
        createQuestionData.validations &&
        createQuestionData.validations.length > 0
      ) {
        const validationsToInsert = createQuestionData.validations.map((v) => ({
          [db.Validations.VALIDATION_TYPE]: v.validationType,
          [db.Validations.QUESTION_ID]: questionId,
          [db.Validations.VALUE_ONE]: v.valueOne,
          [db.Validations.VALUE_TWO]: v.valueTwo,
          [db.Validations.VALUE_THREE]: v.valueThree,
          [db.Validations.VALUE_FOUR]: v.valueFour
        }))

        await trx(db.Tables.VALIDATIONS).insert(validationsToInsert)
      }

      return questionId
    })
  }

  async findAllBySectionId(formSectionId: number): Promise<Question[]> {
    const questions: Question[] = await this.knex(db.Tables.QUESTIONS)
      .where(db.Questions.FORM_SECTION_ID, formSectionId)
      .orderBy(db.Questions.QUESTION_ORDER, 'asc')

    questions.forEach((question) => {
      if (
        question.answerDisplayValue &&
        typeof question.answerDisplayValue === 'string'
      ) {
        question.answerDisplayValue = question.answerDisplayValue
          .split('||')
          .map((value) => {
            return Number(value)
          })
      }
    })

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

  async createQuestionOptions(
    questionOptions: QuestionOption[]
  ): Promise<void> {
    if (questionOptions.length === 0) return

    const optionsData = questionOptions.map((option) => ({
      [db.QuestionOptions.QUESTION_ID]: option.questionId,
      [db.QuestionOptions.QUESTION_OPTION_TYPE]: option.questionOptionType,
      [db.QuestionOptions.QUESTION_OPTION_VALUE]: option.questionOptionValue
    }))

    await this.knex(db.Tables.QUESTION_OPTIONS).insert(optionsData)
  }

  async deleteQuestionOptions(questionId: number): Promise<void> {
    await this.knex(db.Tables.QUESTION_OPTIONS)
      .where(db.QuestionOptions.QUESTION_ID, questionId)
      .del()
  }

  async findQuestionOptionsByQuestionId(
    questionId: number
  ): Promise<QuestionOption[]> {
    const options = await this.knex(db.Tables.QUESTION_OPTIONS)
      .select(
        db.QuestionOptions.QUESTION_OPTION_TYPE,
        db.QuestionOptions.QUESTION_OPTION_VALUE,
        db.QuestionOptions.QUESTION_OPTION_ID,
        db.QuestionOptions.QUESTION_ID
      )
      .where(db.QuestionOptions.QUESTION_ID, questionId)

    return options
  }
}
