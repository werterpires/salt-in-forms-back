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

export interface UpdateAnswerComment {
  answerComment: string
  answerId: number
}
