
import { BadRequestException } from '@nestjs/common'
import { VALIDATION_SPECIFICATIONS_BY_TYPE } from '../questions/validations'
import { Validation } from '../questions/types'

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
      case 1: // OPEN_ANSWER
        return this.OPEN_ANSWER_VALID_VALIDATIONS_TYPES
      case 2: // MULTIPLE_CHOICE
        return this.MULTIPLE_CHOICE_VALID_VALIDATIONS_TYPES
      case 3: // SINGLE_CHOICE
        return this.SINGLE_CHOICE_VALID_VALIDATIONS_TYPES
      case 4: // LIKERT_SCALE
        return this.LIKERT_SCALE_VALID_VALIDATIONS_TYPES
      case 5: // SINGLE_CHOICE_MATRIX
        return this.SINGLE_CHOICE_MATRIX_VALID_VALIDATIONS_TYPES
      case 6: // MULTIPLE_CHOICE_MATRIX
        return this.MULTIPLE_CHOICE_MATRIX_VALID_VALIDATIONS_TYPES
      case 7: // DATE
        return this.DATE_VALID_VALIDATIONS_TYPES
      case 8: // TIME
        return this.TIME_VALID_VALIDATIONS_TYPES
      case 9: // MULTIPLE_RESPONSES
        return this.MULTIPLE_RESPONSES_VALID_VALIDATIONS_TYPES
      case 10: // EMAIL
        return this.EMAIL_VALID_VALIDATIONS_TYPES
      case 11: // FIELDS
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
}
