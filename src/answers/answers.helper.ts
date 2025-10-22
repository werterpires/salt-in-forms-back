
import { BadRequestException } from '@nestjs/common'
import { VALIDATION_SPECIFICATIONS_BY_TYPE } from '../questions/validations'
import {
  Validation,
  QuestionWithDisplayRules,
  QuestionBasic
} from '../questions/types'
import { EQuestionsTypes } from '../constants/questions-types.enum'
import { QuestionDependent } from './types'
import { FormSectionWithDisplayRules } from '../form-sections/types'

export class AnswersHelper {
  private static readonly OPEN_ANSWER_VALID_VALIDATIONS_TYPES = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 19, 20, 21, 22, 23, 24
  ]
  
  private static readonly MULTIPLE_CHOICE_VALID_VALIDATIONS_TYPES: number[] = []
  private static readonly SINGLE_CHOICE_VALID_VALIDATIONS_TYPES: number[] = []
  private static readonly LIKERT_SCALE_VALID_VALIDATIONS_TYPES: number[] = []
  private static readonly SINGLE_CHOICE_MATRIX_VALID_VALIDATIONS_TYPES: number[] = []
  private static readonly MULTIPLE_CHOICE_MATRIX_VALID_VALIDATIONS_TYPES: number[] = []
  private static readonly DATE_VALID_VALIDATIONS_TYPES: number[] = []
  private static readonly TIME_VALID_VALIDATIONS_TYPES: number[] = []
  private static readonly MULTIPLE_RESPONSES_VALID_VALIDATIONS_TYPES: number[] = []
  private static readonly EMAIL_VALID_VALIDATIONS_TYPES: number[] = []
  private static readonly FIELDS_VALID_VALIDATIONS_TYPES: number[] = []

  static getValidValidationsTypesByQuestionType(questionType: number): number[] {
    switch (questionType) {
      case EQuestionsTypes.OPEN_ANSWER:
        return this.OPEN_ANSWER_VALID_VALIDATIONS_TYPES
      case EQuestionsTypes.MULTIPLE_CHOICE:
        return this.MULTIPLE_CHOICE_VALID_VALIDATIONS_TYPES
      case EQuestionsTypes.SINGLE_CHOICE:
        return this.SINGLE_CHOICE_VALID_VALIDATIONS_TYPES
      case EQuestionsTypes.LIKERT_SCALE:
        return this.LIKERT_SCALE_VALID_VALIDATIONS_TYPES
      case EQuestionsTypes.SINGLE_CHOICE_MATRIX:
        return this.SINGLE_CHOICE_MATRIX_VALID_VALIDATIONS_TYPES
      case EQuestionsTypes.MULTIPLE_CHOICE_MATRIX:
        return this.MULTIPLE_CHOICE_MATRIX_VALID_VALIDATIONS_TYPES
      case EQuestionsTypes.DATE:
        return this.DATE_VALID_VALIDATIONS_TYPES
      case EQuestionsTypes.TIME:
        return this.TIME_VALID_VALIDATIONS_TYPES
      case EQuestionsTypes.MULTIPLE_RESPONSES:
        return this.MULTIPLE_RESPONSES_VALID_VALIDATIONS_TYPES
      case EQuestionsTypes.EMAIL:
        return this.EMAIL_VALID_VALIDATIONS_TYPES
      case EQuestionsTypes.FIELDS:
        return this.FIELDS_VALID_VALIDATIONS_TYPES
      default:
        return []
    }
  }

  static filterValidValidations(
    validations: Validation[],
    questionType: number
  ): Validation[] {
    const validTypes = this.getValidValidationsTypesByQuestionType(questionType)
    return validations.filter((validation) =>
      validTypes.includes(validation.validationType)
    )
  }

  static validateAnswer(
    answerValue: string,
    validations: Validation[]
  ): void {
    const errorMessages: string[] = []

    for (const validation of validations) {
      const spec = VALIDATION_SPECIFICATIONS_BY_TYPE[validation.validationType]
      
      if (!spec) {
        continue
      }

      const result = spec.validationFunction(
        answerValue,
        validation.valueOne,
        validation.valueTwo,
        validation.valueThree,
        validation.valueFour
      )

      if (!result.isValid && result.errorMessage) {
        errorMessages.push(result.errorMessage)
      }
    }

    if (errorMessages.length > 0) {
      throw new BadRequestException(`#${errorMessages[0]}`)
    }
  }

  static buildDependentsArray(
    sectionsUsingQuestion: FormSectionWithDisplayRules[],
    questionsFromSections: QuestionBasic[],
    questionsUsingQuestion: QuestionWithDisplayRules[]
  ): QuestionDependent[] {
    const dependents: QuestionDependent[] = []
    const addedQuestionIds = new Set<number>()

    // 1) Processar seções que referenciam a questionA
    for (const section of sectionsUsingQuestion) {
      const sectionQuestions = questionsFromSections.filter(
        (q) => q.formSectionId === section.formSectionId
      )

      for (const question of sectionQuestions) {
        const dependent: QuestionDependent = {
          questionId: question.questionId,
          displayRule: section.formSectionDisplayRule,
          answerDisplayRule: section.answerDisplayRule,
          answerDisplayValue: section.answerDisplayValue
        }

        dependents.push(dependent)
        addedQuestionIds.add(question.questionId)
      }
    }

    // 2) Processar questões que referenciam diretamente a questionA
    for (const question of questionsUsingQuestion) {
      // Verificar se já não está no array
      if (!addedQuestionIds.has(question.questionId)) {
        const dependent: QuestionDependent = {
          questionId: question.questionId,
          displayRule: question.questionDisplayRule,
          answerDisplayRule: question.answerDisplayRule,
          answerDisplayValue: question.answerDisplayValue
        }

        dependents.push(dependent)
        addedQuestionIds.add(question.questionId)
      }
    }

    return dependents
  }
}
