export interface CreateAnswer {
  questionId: number
  formCandidateId: number
  answerValue: string
  validAnswer: boolean
}
export interface Answer {
  questionId: number
  formCandidateId: number
  answerValue: string | null
  validAnswer: boolean
}

export interface UpdateAnswerComment {
  answerComment: string
  answerId: number
}
