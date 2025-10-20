export interface CreateAnswer {
  questionId: number
  formCandidateId: number
  answerValue: string
  validAnswer: boolean
}
export interface Answer {
  questionId: number
  formCandidateId: number
  answerValue: string
  validAnswer: boolean
  answerComment: string
}

export interface UpdateAnswerComment {
  answerComment: string
  answerId: number
}
