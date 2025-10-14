import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import {
  CreateSForm,
  SForm,
  SFormFilter,
  SFormToValidate,
  UpdateSForm,
  CopySForm,
  SFormType,
  SFormSimple
} from './types'
import * as db from '../constants/db-schema.enum'
import { Paginator } from 'src/shared/types/types'
import { applyFilters } from './s-forms.helper'

@Injectable()
export class SFormsRepo {
  elementsPerPage = 20

  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async createSForm(createSFormData: CreateSForm) {
    const insertData: Partial<Record<keyof typeof db.SForms, number | string>> = {
      [db.SForms.PROCESS_ID]: createSFormData.processId,
      [db.SForms.S_FORM_NAME]: createSFormData.sFormName,
      [db.SForms.S_FORM_TYPE]: createSFormData.sFormType
    }

    if (createSFormData.sFormType === 'normal' && createSFormData.emailQuestionId) {
      insertData[db.SForms.EMAIL_QUESTION_ID] = createSFormData.emailQuestionId
    }

    return this.knex(db.Tables.S_FORMS).insert(insertData)
  }

  async findAllAllFormsByProcessId(
    processId: number,
    orderBy: Paginator<typeof db.SForms>,
    filters?: SFormFilter
  ) {
    const query = this.knex(db.Tables.S_FORMS)
      .select(
        db.SForms.S_FORM_ID,
        db.SForms.S_FORM_NAME,
        db.SForms.S_FORM_TYPE,
        db.SForms.PROCESS_ID,
        db.SForms.EMAIL_QUESTION_ID
      )
      .where(db.SForms.PROCESS_ID, processId)

    query.orderBy(orderBy.column, orderBy.direction)

    query
      .limit(this.elementsPerPage)
      .offset((orderBy.page - 1 || 0) * this.elementsPerPage)

    if (filters) {
      applyFilters(filters, query)
    }
    return (await query) as SForm[]
  }

  async findAllFormTypesByProcessId(processId: number) {
    return (await this.knex(db.Tables.S_FORMS)
      .select(db.SForms.S_FORM_TYPE, db.SForms.S_FORM_ID)
      .where(db.SForms.PROCESS_ID, processId)) as SFormToValidate[]
  }

  async findSFormQuantityByProcessId(processId: number, filters?: SFormFilter) {
    const query = this.knex(db.Tables.S_FORMS).where(
      db.SForms.PROCESS_ID,
      processId
    )

    if (filters) {
      applyFilters(filters, query)
    }
    query.countDistinct(db.SForms.S_FORM_ID)
    const [results] = await query
    const countKey = Object.keys(results)[0]
    const count = Number(results[countKey])
    return Math.ceil(count / this.elementsPerPage) || 0
  }

  updateSForm(updateSFormDAta: UpdateSForm) {
    const { sFormId, sFormName, sFormType, emailQuestionId } = updateSFormDAta

    const updateData: Partial<Record<keyof typeof db.SForms, number | string | null>> = {
      [db.SForms.S_FORM_NAME]: sFormName,
      [db.SForms.S_FORM_TYPE]: sFormType
    }

    if (sFormType === 'normal') {
      updateData[db.SForms.EMAIL_QUESTION_ID] = emailQuestionId !== undefined ? emailQuestionId : null
    } else {
      updateData[db.SForms.EMAIL_QUESTION_ID] = null
    }

    return this.knex(db.Tables.S_FORMS)
      .update(updateData)
      .where({
        [db.SForms.S_FORM_ID]: sFormId
      })
  }

  deleteSForm(sFormId: number) {
    return this.knex(db.Tables.S_FORMS)
      .delete()
      .where({
        [db.SForms.S_FORM_ID]: sFormId
      })
  }

  async findFormByFormId(sFormId: number) {
    const formConsult = (await this.knex(db.Tables.S_FORMS)
      .select(
        db.SForms.S_FORM_ID,
        db.SForms.S_FORM_NAME,
        db.SForms.S_FORM_TYPE,
        db.SForms.PROCESS_ID,
        db.SForms.EMAIL_QUESTION_ID
      )
      .where(db.SForms.S_FORM_ID, sFormId)
      .first()) as SForm

    return formConsult
  }

  async findAllSFormsSimpleByProcessId(
    processId: number
  ): Promise<SFormSimple[]> {
    return this.knex(db.Tables.S_FORMS)
      .select(db.SForms.S_FORM_ID, db.SForms.S_FORM_NAME)
      .where(db.SForms.PROCESS_ID, processId)
      .orderBy(db.SForms.S_FORM_NAME, 'asc')
  }

  async copySForm(copyData: CopySForm, sourceFormType: SFormType) {
    return this.knex.transaction(async (trx) => {
      // 2. Buscar e copiar seções
      const sections = await trx(db.Tables.FORM_SECTIONS)
        .select('*')
        .where(db.FormSections.S_FORM_ID, copyData.sourceSFormId)
        .orderBy(db.FormSections.FORM_SECTION_ORDER, 'asc')

      const sectionsMapping = new Map<number, number>()

      // Primeiro passo: copiar seções sem as referências (para ter os IDs)
      for (const section of sections) {
        const newSection: Partial<Record<keyof typeof db.FormSections, number | string | null>> = {
          [db.FormSections.S_FORM_ID]: copyData.targetFormId,
          [db.FormSections.FORM_SECTION_NAME]:
            section[db.FormSections.FORM_SECTION_NAME],
          [db.FormSections.FORM_SECTION_ORDER]:
            section[db.FormSections.FORM_SECTION_ORDER],
          [db.FormSections.FORM_SECTION_DISPLAY_RULE]:
            section[db.FormSections.FORM_SECTION_DISPLAY_RULE],
          [db.FormSections.FORM_SECTION_DISPLAY_LINK]: null,
          [db.FormSections.QUESTION_DISPLAY_LINK]: null,
          [db.FormSections.ANSWER_DISPLEY_RULE]:
            section[db.FormSections.ANSWER_DISPLEY_RULE],
          [db.FormSections.ANSWER_DISPLAY_VALUE]:
            section[db.FormSections.ANSWER_DISPLAY_VALUE]
        }

        const [newSectionId] = await trx(db.Tables.FORM_SECTIONS).insert(
          newSection
        )
        sectionsMapping.set(
          section[db.FormSections.FORM_SECTION_ID],
          newSectionId
        )
      }

      // 3. Buscar e copiar questões
      const questionsMapping = new Map<number, number>()
      const questionOptionsMapping = new Map<number, number>()

      for (const [oldSectionId, newSectionId] of sectionsMapping.entries()) {
        const questions = await trx(db.Tables.QUESTIONS)
          .select('*')
          .where(db.Questions.FORM_SECTION_ID, oldSectionId)
          .orderBy(db.Questions.QUESTION_ORDER, 'asc')

        for (const question of questions) {
          const newQuestion = {
            [db.Questions.FORM_SECTION_ID]: newSectionId,
            [db.Questions.QUESTION_AREA_ID]:
              question[db.Questions.QUESTION_AREA_ID],
            [db.Questions.QUESTION_ORDER]:
              question[db.Questions.QUESTION_ORDER],
            [db.Questions.QUESTION_TYPE]: question[db.Questions.QUESTION_TYPE],
            [db.Questions.QUESTION_STATEMENT]:
              question[db.Questions.QUESTION_STATEMENT],
            [db.Questions.QUESTION_DESCRIPTION]:
              question[db.Questions.QUESTION_DESCRIPTION],
            [db.Questions.QUESTION_DISPLAY_RULE]:
              question[db.Questions.QUESTION_DISPLAY_RULE],
            [db.Questions.FORM_SECTION_DISPLAY_LINK]: null, // Será atualizado depois
            [db.Questions.QUESTION_DISPLAY_LINK]: null, // Será atualizado depois
            [db.Questions.ANSWER_DISPLEY_RULE]:
              question[db.Questions.ANSWER_DISPLEY_RULE],
            [db.Questions.ANSWER_DISPLAY_VALUE]: null // Será atualizado depois
          }

          const [newQuestionId] = await trx(db.Tables.QUESTIONS).insert(
            newQuestion
          )
          questionsMapping.set(
            question[db.Questions.QUESTION_ID],
            newQuestionId
          )

          // Copiar opções das questões
          const questionOptions = await trx(db.Tables.QUESTION_OPTIONS)
            .select('*')
            .where(
              db.QuestionOptions.QUESTION_ID,
              question[db.Questions.QUESTION_ID]
            )

          for (const option of questionOptions) {
            const newOption = {
              [db.QuestionOptions.QUESTION_ID]: newQuestionId,
              [db.QuestionOptions.QUESTION_OPTION_TYPE]:
                option[db.QuestionOptions.QUESTION_OPTION_TYPE],
              [db.QuestionOptions.QUESTION_OPTION_VALUE]:
                option[db.QuestionOptions.QUESTION_OPTION_VALUE]
            }
            const [newOptionId] = await trx(db.Tables.QUESTION_OPTIONS).insert(
              newOption
            )
            questionOptionsMapping.set(
              option[db.QuestionOptions.QUESTION_OPTION_ID],
              newOptionId
            )
          }

          // Copiar validações das questões
          const validations = await trx(db.Tables.VALIDATIONS)
            .select('*')
            .where(
              db.Validations.QUESTION_ID,
              question[db.Questions.QUESTION_ID]
            )

          for (const validation of validations) {
            const newValidation = {
              [db.Validations.QUESTION_ID]: newQuestionId,
              [db.Validations.VALIDATION_TYPE]:
                validation[db.Validations.VALIDATION_TYPE],
              [db.Validations.VALUE_ONE]: validation[db.Validations.VALUE_ONE],
              [db.Validations.VALUE_TWO]: validation[db.Validations.VALUE_TWO],
              [db.Validations.VALUE_THREE]:
                validation[db.Validations.VALUE_THREE],
              [db.Validations.VALUE_FOUR]: validation[db.Validations.VALUE_FOUR]
            }
            await trx(db.Tables.VALIDATIONS).insert(newValidation)
          }

          // Copiar subquestões
          const subQuestionsMapping = new Map<number, number>()
          const subQuestions = await trx(db.Tables.SUB_QUESTIONS)
            .select('*')
            .where(
              db.SubQuestions.QUESTION_ID,
              question[db.Questions.QUESTION_ID]
            )

          for (const subQuestion of subQuestions) {
            const newSubQuestion = {
              [db.SubQuestions.QUESTION_ID]: newQuestionId,
              [db.SubQuestions.SUB_QUESTION_POSITION]:
                subQuestion[db.SubQuestions.SUB_QUESTION_POSITION],
              [db.SubQuestions.SUB_QUESTION_TYPE]:
                subQuestion[db.SubQuestions.SUB_QUESTION_TYPE],
              [db.SubQuestions.SUB_QUESTION_STATEMENT]:
                subQuestion[db.SubQuestions.SUB_QUESTION_STATEMENT]
            }

            const [newSubQuestionId] = await trx(
              db.Tables.SUB_QUESTIONS
            ).insert(newSubQuestion)
            subQuestionsMapping.set(
              subQuestion[db.SubQuestions.SUB_QUESTION_ID],
              newSubQuestionId
            )

            // Copiar opções das subquestões
            const subOptions = await trx(db.Tables.SUB_QUESTION_OPTIONS)
              .select('*')
              .where(
                db.SubQuestionOptions.QUESTION_ID,
                subQuestion[db.SubQuestions.SUB_QUESTION_ID]
              )

            for (const subOption of subOptions) {
              const newSubOption = {
                [db.SubQuestionOptions.QUESTION_ID]: newSubQuestionId,
                [db.SubQuestionOptions.QUESTION_OPTION_TYPE]:
                  subOption[db.SubQuestionOptions.QUESTION_OPTION_TYPE],
                [db.SubQuestionOptions.QUESTION_OPTION_VALUE]:
                  subOption[db.SubQuestionOptions.QUESTION_OPTION_VALUE]
              }
              await trx(db.Tables.SUB_QUESTION_OPTIONS).insert(newSubOption)
            }

            // Copiar validações das subquestões
            const subValidations = await trx(db.Tables.SUB_VALIDATIONS)
              .select('*')
              .where(
                db.SubValidations.QUESTION_ID,
                subQuestion[db.SubQuestions.SUB_QUESTION_ID]
              )

            for (const subValidation of subValidations) {
              const newSubValidation = {
                [db.SubValidations.QUESTION_ID]: newSubQuestionId,
                [db.SubValidations.VALIDATION_TYPE]:
                  subValidation[db.SubValidations.VALIDATION_TYPE],
                [db.SubValidations.VALUE_ONE]:
                  subValidation[db.SubValidations.VALUE_ONE],
                [db.SubValidations.VALUE_TWO]:
                  subValidation[db.SubValidations.VALUE_TWO],
                [db.SubValidations.VALUE_THREE]:
                  subValidation[db.SubValidations.VALUE_THREE],
                [db.SubValidations.VALUE_FOUR]:
                  subValidation[db.SubValidations.VALUE_FOUR]
              }
              await trx(db.Tables.SUB_VALIDATIONS).insert(newSubValidation)
            }
          }
        }
      }

      // Helper function to remap ANSWER_DISPLAY_VALUE
      const remapAnswerDisplayValue = (
        answerDisplayValue: string | null
      ): string | null => {
        if (!answerDisplayValue) return null

        const optionIds = answerDisplayValue.split('||')
        const newOptionIds = optionIds
          .map((id) => questionOptionsMapping.get(parseInt(id)))
          .filter((id) => id !== undefined)

        return newOptionIds.length > 0 ? newOptionIds.join('||') : null
      }

      // 4. Atualizar referências nas seções
      for (const section of sections) {
        const newSectionId = sectionsMapping.get(
          section[db.FormSections.FORM_SECTION_ID]
        )

        const updates: Partial<Record<keyof typeof db.FormSections, number | string | null>> = {}

        // Mapear formSectionDisplayLink
        if (section[db.FormSections.FORM_SECTION_DISPLAY_LINK]) {
          const newRefSectionId = sectionsMapping.get(
            section[db.FormSections.FORM_SECTION_DISPLAY_LINK]
          )
          if (newRefSectionId) {
            updates[db.FormSections.FORM_SECTION_DISPLAY_LINK] = newRefSectionId
          }
        }

        // Mapear questionDisplayLink
        if (section[db.FormSections.QUESTION_DISPLAY_LINK]) {
          const newRefQuestionId = questionsMapping.get(
            section[db.FormSections.QUESTION_DISPLAY_LINK]
          )
          if (newRefQuestionId) {
            updates[db.FormSections.QUESTION_DISPLAY_LINK] = newRefQuestionId
          }
        }

        // Mapear answerDisplayValue
        if (section[db.FormSections.ANSWER_DISPLAY_VALUE]) {
          const newAnswerDisplayValue = remapAnswerDisplayValue(
            section[db.FormSections.ANSWER_DISPLAY_VALUE] as string
          )
          if (newAnswerDisplayValue) {
            updates[db.FormSections.ANSWER_DISPLAY_VALUE] =
              newAnswerDisplayValue
          }
        }

        if (Object.keys(updates).length > 0) {
          await trx(db.Tables.FORM_SECTIONS)
            .where(db.FormSections.FORM_SECTION_ID, newSectionId)
            .update(updates)
        }
      }

      // 5. Atualizar referências nas questões
      for (const [oldQuestionId, newQuestionId] of questionsMapping.entries()) {
        const originalQuestion = await trx(db.Tables.QUESTIONS)
          .select('*')
          .where(db.Questions.QUESTION_ID, oldQuestionId)
          .first()

        const updates: Partial<Record<keyof typeof db.Questions, number | string | null>> = {}

        // Mapear formSectionDisplayLink
        if (originalQuestion[db.Questions.FORM_SECTION_DISPLAY_LINK]) {
          const newRefSectionId = sectionsMapping.get(
            originalQuestion[db.Questions.FORM_SECTION_DISPLAY_LINK]
          )
          if (newRefSectionId) {
            updates[db.Questions.FORM_SECTION_DISPLAY_LINK] = newRefSectionId
          }
        }

        // Mapear questionDisplayLink
        if (originalQuestion[db.Questions.QUESTION_DISPLAY_LINK]) {
          const newRefQuestionId = questionsMapping.get(
            originalQuestion[db.Questions.QUESTION_DISPLAY_LINK]
          )
          if (newRefQuestionId) {
            updates[db.Questions.QUESTION_DISPLAY_LINK] = newRefQuestionId
          }
        }

        // Mapear answerDisplayValue
        if (originalQuestion[db.Questions.ANSWER_DISPLAY_VALUE]) {
          const newAnswerDisplayValue = remapAnswerDisplayValue(
            originalQuestion[db.Questions.ANSWER_DISPLAY_VALUE] as string
          )
          if (newAnswerDisplayValue) {
            updates[db.Questions.ANSWER_DISPLAY_VALUE] = newAnswerDisplayValue
          }
        }

        if (Object.keys(updates).length > 0) {
          await trx(db.Tables.QUESTIONS)
            .where(db.Questions.QUESTION_ID, newQuestionId)
            .update(updates)
        }
      }
    })
  }
}