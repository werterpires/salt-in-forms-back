import { BadRequestException } from '@nestjs/common'
import { VALIDATION_SPECIFICATIONS_BY_TYPE } from '../questions/validations'
import {
  Validation,
  QuestionWithDisplayRules,
  QuestionBasic
} from '../questions/types'
import { EQuestionsTypes } from '../constants/questions-types.enum'
import { QuestionDependent, Answer } from './types'
import { FormSectionWithDisplayRules } from '../form-sections/types'
import { AnswersDisplayRules } from '../constants/answer_display_rule'
import { FormSectionDisplayRules } from '../constants/form-section-display-rules.const'
import { EncryptionService } from '../shared/utils-module/encryption/encryption.service'

export class AnswersHelper {
  private static readonly OPEN_ANSWER_VALID_VALIDATIONS_TYPES = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 19, 20, 21, 22, 23, 24, 28
  ]

  private static readonly MULTIPLE_CHOICE_VALID_VALIDATIONS_TYPES: number[] = [
    5
  ]
  private static readonly SINGLE_CHOICE_VALID_VALIDATIONS_TYPES: number[] = [5]
  private static readonly LIKERT_SCALE_VALID_VALIDATIONS_TYPES: number[] = []
  private static readonly SINGLE_CHOICE_MATRIX_VALID_VALIDATIONS_TYPES: number[] =
    [5]
  private static readonly MULTIPLE_CHOICE_MATRIX_VALID_VALIDATIONS_TYPES: number[] =
    [5]
  private static readonly DATE_VALID_VALIDATIONS_TYPES: number[] = [
    5, 12, 13, 14, 15, 16
  ]
  private static readonly TIME_VALID_VALIDATIONS_TYPES: number[] = [
    5, 17, 18, 25, 26
  ]
  private static readonly MULTIPLE_RESPONSES_VALID_VALIDATIONS_TYPES: number[] =
    [5]
  private static readonly EMAIL_VALID_VALIDATIONS_TYPES: number[] = [5, 8, 27]
  private static readonly FIELDS_VALID_VALIDATIONS_TYPES: number[] = [5]

  static getValidValidationsTypesByQuestionType(
    questionType: number
  ): number[] {
    switch (questionType as EQuestionsTypes) {
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

  static validateAnswer(answerValue: string, validations: Validation[]): void {
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

  static async validateAnswerWithEmailUniqueness(
    answerValue: string,
    validations: Validation[],
    questionType: number,
    candidateId: number,
    currentFormCandidateId: number,
    answersRepo: any,
    encryptionService: EncryptionService
  ): Promise<void> {
    const errorMessages: string[] = []

    for (const validation of validations) {
      const spec = VALIDATION_SPECIFICATIONS_BY_TYPE[validation.validationType]

      if (!spec) {
        continue
      }

      let valueOne = validation.valueOne
      const valueTwo = validation.valueTwo
      const valueThree = validation.valueThree
      const valueFour = validation.valueFour

      // Se for validação de email único (tipo 27) e questão de email (tipo 10)
      if (validation.validationType === 27 && questionType === 10) {
        // Buscar todos os emails já utilizados pelo candidato
        const existingEmailAnswers =
          await answersRepo.findEmailAnswersByCandidateId(candidateId)

        // Descriptografar os emails e criar string concatenada
        const usedEmails = existingEmailAnswers
          .map((answer: Answer) =>
            answer.answerValue
              ? this.decryptAnswerValue(answer.answerValue, encryptionService)
              : ''
          )
          .filter((email: string) => email && email.trim() !== '')
          .join('||')

        valueOne = usedEmails
      }

      const result = spec.validationFunction(
        answerValue,
        valueOne,
        valueTwo,
        valueThree,
        valueFour
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

  static evaluateAnswerDisplayRule(
    answerValue: string,
    answerDisplayRule: number,
    answerDisplayValue: string | number[] | undefined
  ): boolean {
    if (!answerDisplayValue) {
      return false
    }

    // Converter answerDisplayValue para string se for array
    const displayValueStr =
      typeof answerDisplayValue === 'string'
        ? answerDisplayValue
        : answerDisplayValue.join('||')

    // Converter strings em arrays baseados em ||
    const answerArray = answerValue.split('||').map((v) => v.trim())
    const displayArray = displayValueStr.split('||').map((v) => v.trim())

    switch (answerDisplayRule as AnswersDisplayRules) {
      case AnswersDisplayRules.EQUALS:
        // Verifica se os arrays são iguais (mesmo conteúdo, ordem independente)
        if (answerArray.length !== displayArray.length) {
          return false
        }
        return answerArray.every((val) => displayArray.includes(val))

      case AnswersDisplayRules.MORE_THAN:
        return parseFloat(answerValue) > parseFloat(displayValueStr)

      case AnswersDisplayRules.LESS_THAN:
        return parseFloat(answerValue) < parseFloat(displayValueStr)

      case AnswersDisplayRules.MORE_THAN_OR_EQUAL:
        return parseFloat(answerValue) >= parseFloat(displayValueStr)

      case AnswersDisplayRules.LESS_THAN_OR_EQUAL:
        return parseFloat(answerValue) <= parseFloat(displayValueStr)

      case AnswersDisplayRules.INCLUDES:
        // Verifica se answerArray inclui algum elemento de displayArray
        return displayArray.some((val) => answerArray.includes(val))

      case AnswersDisplayRules.EXCLUDES:
        // Verifica se answerArray não inclui nenhum elemento de displayArray
        return !displayArray.some((val) => answerArray.includes(val))

      default:
        return false
    }
  }

  static processDependentValidity(
    answerValue: string,
    dependent: QuestionDependent
  ): { questionId: number; shouldProcess: boolean; validAnswer: boolean } {
    // Se displayRule for ALWAYS_SHOW (1), não processa
    if (
      (dependent.displayRule as FormSectionDisplayRules) ===
      FormSectionDisplayRules.ALWAYS_SHOW
    ) {
      return {
        questionId: dependent.questionId,
        shouldProcess: false,
        validAnswer: true
      }
    }

    // Avaliar a answerDisplayRule
    let validAnswer = false
    if (dependent.answerDisplayRule) {
      validAnswer = this.evaluateAnswerDisplayRule(
        answerValue,
        dependent.answerDisplayRule,
        dependent.answerDisplayValue
      )
    }

    // Aplicar a displayRule
    if (
      (dependent.displayRule as FormSectionDisplayRules) ===
      FormSectionDisplayRules.DONT_SHOW_IF
    ) {
      // Inverte o booleano
      validAnswer = !validAnswer
    }
    // Se displayRule for SHOW_IF (2), mantém como está

    return {
      questionId: dependent.questionId,
      shouldProcess: true,
      validAnswer
    }
  }

  static encryptAnswerValue(
    answerValue: string,
    encryptionService: EncryptionService
  ): string {
    return encryptionService.encrypt(answerValue)
  }

  static decryptAnswerValue(
    encryptedValue: string,
    encryptionService: EncryptionService
  ): string {
    return encryptionService.decrypt(encryptedValue)
  }

  static decryptAnswer(
    answer: Answer | undefined,
    encryptionService: EncryptionService
  ): Answer | undefined {
    if (!answer) {
      return undefined
    }

    if (answer.answerValue) {
      return {
        ...answer,
        answerValue: this.decryptAnswerValue(
          answer.answerValue,
          encryptionService
        )
      }
    }

    return answer
  }

  static decryptAnswers(
    answers: Answer[],
    encryptionService: EncryptionService
  ): Answer[] {
    return answers.map((answer) => ({
      ...answer,
      answerValue: answer.answerValue
        ? this.decryptAnswerValue(answer.answerValue, encryptionService)
        : answer.answerValue
    }))
  }
}
