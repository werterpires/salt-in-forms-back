import { Candidate } from 'src/candidates/types'

export interface InterviewData {
  candidate: Candidate
  interviewForms: InterviewForm[]
}

export interface InterviewForm {
  sFormId: number
  sFormName: string
  interviewAnswers: InterviewAnswer[]
}

export interface InterviewAnswer {
  questionId: number
  questionOrder: number
  questionStatement: string
  questionAreaId: number
  questionAreaName: string
  questionAreaDescription: string
  answerId: number
  answerValue: string
  answerComment: string | null
}

export interface Rate {
  rateId: number
  candidateId: number
  interviewerId: number
  questionAreaId: number
  questionAreaName: string
  questionAreaDescription: string
  rateValue: number | null
  rateComment: string | null
  createdAt: string
  updatedAt: string
}
