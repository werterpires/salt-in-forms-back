// Representa uma validação associada a uma questão
export interface Validation {
  validationType: number
  valueOne?: any
  valueTwo?: any
  valueThree?: any
  valueFour?: any
}
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
}

export interface QuestionOption {
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
  validationFunction: (...args: any[]) => boolean
}

type AcceptedTypes = 'string' | 'number' | 'boolean' | 'undefined'
