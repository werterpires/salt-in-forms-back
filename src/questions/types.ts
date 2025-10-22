import { CreateSubQuestionDto } from './dto/create-question.dto'
import { QuestionOptionDto } from './dto/optionsDto'
import { validationResult } from './validations'

// Representa uma validação associada a uma questão
export interface Validation {
  validationType: number
  valueOne?: any
  valueTwo?: any
  valueThree?: any
  valueFour?: any
}

export interface SubValidation {
  validationType: number
  valueOne?: any
  valueTwo?: any
  valueThree?: any
  valueFour?: any
}

export interface QuestionOption {
  questionOptionId?: number
  questionId?: number
  questionOptionType: number
  questionOptionValue: string
}

export interface SubQuestionOptions {
  questionOptionId?: number
  questionId: number
  questionOptionType: number
  questionOptionValue: string
}

export interface ValidationSpcification {
  validationType: number
  validationName: string
  validationDescription: string
  valueOneType: AcceptedTypes
  valueTwoType: AcceptedTypes
  valueThreeType: AcceptedTypes
  valueFourType: AcceptedTypes
  validationFunction: (...args: any[]) => validationResult
}

type AcceptedTypes = 'string' | 'number' | 'boolean' | 'undefined'

export interface Question {
  questionId: number
  formSectionId: number
  questionAreaId: number
  questionOrder: number
  questionType: number
  questionStatement: string
  questionDescription: string
  questionDisplayRule: number
  formSectionDisplayLink?: number
  questionDisplayLink?: number
  answerDisplayRule?: number
  answerDisplayValue?: string | number[]
  createdAt: Date
  updatedAt: Date
  questionOptions?: QuestionOption[]
  validations?: Validation[]
  subQuestions?: SubQuestion[]
}

export interface SubQuestion {
  subQuestionId?: number
  subQuestionPosition: number
  subQuestionType: number
  subQuestionStatement: string
  questionId: number
  subQuestionOptions?: SubQuestionOptions[]
  subValidations?: SubValidation[]
}

export interface CreateQuestion {
  formSectionId: number
  questionAreaId: number
  questionOrder: number
  questionType: number
  questionStatement: string
  questionDescription: string
  questionDisplayRule: number
  formSectionDisplayLink?: number
  questionDisplayLink?: number
  answerDisplayRule?: number
  answerDisplayValue?: string
  validations?: Validation[]
  subQuestions?: CreateSubQuestionDto[]
  questionOptions?: QuestionOptionDto[]
}

export interface UpdateQuestion {
  questionId: number
  questionAreaId: number
  questionType: number
  questionStatement: string
  questionDescription: string
  questionDisplayRule: number
  formSectionDisplayLink?: number
  questionDisplayLink?: number
  answerDisplayRule?: number
  answerDisplayValue?: string
  validations?: Validation[]
  subQuestions?: SubQuestion[]
  questionOptions?: QuestionOption[]
}

export interface QuestionWithDisplayRules {
  questionId: number
  questionOrder: number
  questionStatement: string
  questionDisplayRule: number
  answerDisplayRule?: number
  answerDisplayValue?: string | number[]
}

export interface QuestionBasic {
  questionId: number
  formSectionId: number
}
