export interface CreateAnswer {
  questionId: number
  formCandidateId: number
  answerValue: string
  validAnswer: boolean
}

export interface Answer {
  answerId: number
  questionId: number
  formCandidateId: number
  answerValue: string | null
  validAnswer: boolean
}

export interface AnswerWithoutId {
  answerValue: string | null
  validAnswer: boolean
}

export interface UpdateAnswerComment {
  answerComment: string
  answerId: number
}

export interface QuestionDependent {
  questionId: number
  displayRule: number
  answerDisplayRule?: number
  answerDisplayValue?: string | number[]
}

export interface DependentProcessingResult {
  questionId: number
  validAnswer: boolean
}
