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
  answerDisplayValue?: string
  createdAt: Date
  updatedAt: Date
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
