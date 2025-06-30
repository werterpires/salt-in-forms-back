
export interface Question {
  questionId: number
  formSectionId: number
  questionName: string
  questionOrder: number
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
  questionName: string
  questionOrder: number
  questionDisplayRule: number
  formSectionDisplayLink?: number
  questionDisplayLink?: number
  answerDisplayRule?: number
  answerDisplayValue?: string
}

export interface UpdateQuestion {
  questionId: number
  questionName: string
  questionDisplayRule: number
  formSectionDisplayLink?: number
  questionDisplayLink?: number
  answerDisplayRule?: number
  answerDisplayValue?: string
}
