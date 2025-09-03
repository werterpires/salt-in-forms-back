import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import {
  Question,
  CreateQuestion,
  UpdateQuestion,
  QuestionOption,
  Validation
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

      // Inserir opções, se houver
      if (
        createQuestionData.questionOptions &&
        createQuestionData.questionOptions.length > 0
      ) {
        for (let option of createQuestionData.questionOptions) {
          await trx(db.Tables.QUESTION_OPTIONS).insert({
            [db.QuestionOptions.QUESTION_ID]: questionId,
            [db.QuestionOptions.QUESTION_OPTION_TYPE]:
              option.questionOptionType,
            [db.QuestionOptions.QUESTION_OPTION_VALUE]:
              option.questionOptionValue
          })
        }
      }

      if (
        !createQuestionData.subQuestions ||
        createQuestionData.subQuestions.length === 0
      ) {
        return questionId
      }

      console.log(
        'createQuestionData.subQuestions',
        createQuestionData.subQuestions
      )

      // Inserir subquestões
      for (let subQuestion of createQuestionData.subQuestions) {
        const subQuestionId = await trx(db.Tables.SUB_QUESTIONS).insert({
          [db.SubQuestions.QUESTION_ID]: questionId,
          [db.SubQuestions.SUB_QUESTION_STATEMENT]:
            subQuestion.subQuestionStatement,
          [db.SubQuestions.SUB_QUESTION_POSITION]:
            subQuestion.subQuestionPosition,
          [db.SubQuestions.SUB_QUESTION_TYPE]: subQuestion.subQuestionType
        })

        if (
          subQuestion.subQuestionOptions &&
          subQuestion.subQuestionOptions.length > 0
        ) {
          for (let subOption of subQuestion.subQuestionOptions) {
            await trx(db.Tables.SUB_QUESTION_OPTIONS).insert({
              [db.SubQuestionOptions.QUESTION_ID]: subQuestionId,
              [db.SubQuestionOptions.QUESTION_OPTION_TYPE]:
                subOption.questionOptionType,
              [db.SubQuestionOptions.QUESTION_OPTION_VALUE]:
                subOption.questionOptionValue
            })
          }
        }

        if (
          subQuestion.subValidations &&
          subQuestion.subValidations.length > 0
        ) {
          for (let subValidation of subQuestion.subValidations) {
            await trx(db.Tables.SUB_VALIDATIONS).insert({
              [db.SubValidations.VALIDATION_TYPE]: subValidation.validationType,
              [db.SubValidations.QUESTION_ID]: subQuestionId,
              [db.SubValidations.VALUE_ONE]: subValidation.valueOne,
              [db.SubValidations.VALUE_TWO]: subValidation.valueTwo,
              [db.SubValidations.VALUE_THREE]: subValidation.valueThree,
              [db.SubValidations.VALUE_FOUR]: subValidation.valueFour
            })
          }
        }
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

  async findValidationsByQuestionId(questionId: number): Promise<Validation[]> {
    const validations = await this.knex(db.Tables.VALIDATIONS)
      .select(
        db.Validations.VALIDATION_TYPE,
        db.Validations.VALUE_ONE,
        db.Validations.VALUE_TWO,
        db.Validations.VALUE_THREE,
        db.Validations.VALUE_FOUR
      )
      .where(db.Validations.QUESTION_ID, questionId)

    return validations.map((validation) => ({
      validationType: validation[db.Validations.VALIDATION_TYPE],
      valueOne: validation[db.Validations.VALUE_ONE],
      valueTwo: validation[db.Validations.VALUE_TWO],
      valueThree: validation[db.Validations.VALUE_THREE],
      valueFour: validation[db.Validations.VALUE_FOUR]
    }))
  }

  async deleteValidations(questionId: number): Promise<void> {
    await this.knex(db.Tables.VALIDATIONS)
      .where(db.Validations.QUESTION_ID, questionId)
      .del()
  }

  async createValidations(
    questionId: number,
    validations: Validation[]
  ): Promise<void> {
    if (validations.length === 0) return

    const validationsToInsert = validations.map((v) => ({
      [db.Validations.VALIDATION_TYPE]: v.validationType,
      [db.Validations.QUESTION_ID]: questionId,
      [db.Validations.VALUE_ONE]: v.valueOne,
      [db.Validations.VALUE_TWO]: v.valueTwo,
      [db.Validations.VALUE_THREE]: v.valueThree,
      [db.Validations.VALUE_FOUR]: v.valueFour
    }))

    await this.knex(db.Tables.VALIDATIONS).insert(validationsToInsert)
  }

  async findSubQuestionsByQuestionId(questionId: number): Promise<any[]> {
    const subQuestions = await this.knex(db.Tables.SUB_QUESTIONS)
      .where(db.SubQuestions.QUESTION_ID, questionId)
      .orderBy(db.SubQuestions.SUB_QUESTION_POSITION, 'asc')

    return subQuestions
  }

  async findSubValidationsBySubQuestionId(subQuestionId: number): Promise<any[]> {
    const subValidations = await this.knex(db.Tables.SUB_VALIDATIONS)
      .select(
        db.SubValidations.VALIDATION_TYPE,
        db.SubValidations.VALUE_ONE,
        db.SubValidations.VALUE_TWO,
        db.SubValidations.VALUE_THREE,
        db.SubValidations.VALUE_FOUR
      )
      .where(db.SubValidations.QUESTION_ID, subQuestionId)

    return subValidations.map((validation) => ({
      validationType: validation[db.SubValidations.VALIDATION_TYPE],
      valueOne: validation[db.SubValidations.VALUE_ONE],
      valueTwo: validation[db.SubValidations.VALUE_TWO],
      valueThree: validation[db.SubValidations.VALUE_THREE],
      valueFour: validation[db.SubValidations.VALUE_FOUR]
    }))
  }

  async findSubQuestionOptionsBySubQuestionId(subQuestionId: number): Promise<any[]> {
    const options = await this.knex(db.Tables.SUB_QUESTION_OPTIONS)
      .select(
        db.SubQuestionOptions.QUESTION_OPTION_TYPE,
        db.SubQuestionOptions.QUESTION_OPTION_VALUE,
        db.SubQuestionOptions.QUESTION_OPTION_ID,
        db.SubQuestionOptions.QUESTION_ID
      )
      .where(db.SubQuestionOptions.QUESTION_ID, subQuestionId)

    return options
  }
}
