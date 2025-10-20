export interface Candidate {
  candidateId: number
  processId: number
  candidateName: string
  candidateUniqueDocument: string
  candidateEmail: string
  candidatePhone: string
  candidateBirthdate: string
  candidateForeigner: boolean
  candidateAddress: string
  candidateAddressNumber: string
  candidateDistrict: string
  candidateCity: string
  candidateState: string
  candidateZipCode: string
  candidateCountry: string
  interviewUserId?: number
}

export interface CreateCandidate {
  processId: number
  candidateName: string
  candidateUniqueDocument: string
  candidateEmail: string
  candidatePhone: string
  candidateBirthdate: string
  candidateForeigner: boolean
  candidateAddress: string
  candidateAddressNumber: string
  candidateDistrict: string
  candidateCity: string
  candidateState: string
  candidateZipCode: string
  candidateCountry: string
}

export interface FormCandidate {
  formCandidateId: number
  candidateId: number
  sFormId: number
  formCandidateStatus: number
  formCandidateAccessCode: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateFormCandidate {
  candidateId: number
  sFormId: number
  formCandidateStatus: number
  formCandidateAccessCode: string
}

export interface AccessCodeMapEntry {
  candidateId: number
  sFormId: number
}

export interface QuestionOptionToAnswer {
  questionOptionId: number
  questionOptionType: number
  questionOptionValue: string
}

export interface ValidationToAnswer {
  validationType: number
  valueOne?: string | null
  valueTwo?: string | null
  valueThree?: string | null
  valueFour?: string | null
}

export interface SubQuestionOptionToAnswer {
  questionOptionId: number
  questionOptionType: number
  questionOptionValue: string
}

export interface SubValidationToAnswer {
  validationType: number
  valueOne?: string | null
  valueTwo?: string | null
  valueThree?: string | null
  valueFour?: string | null
}

export interface SubQuestionToAnswer {
  subQuestionId: number
  subQuestionPosition: number
  subQuestionType: number
  subQuestionStatement: string
  subQuestionOptions: SubQuestionOptionToAnswer[]
  subValidations: SubValidationToAnswer[]
}

export interface QuestionToAnswer {
  questionId: number
  questionOrder: number
  questionType: number
  questionStatement: string
  questionDescription: string
  options: QuestionOptionToAnswer[]
  validations: ValidationToAnswer[]
  subQuestions: SubQuestionToAnswer[]
}

export interface SectionToAnswer {
  formSectionId: number
  formSectionName: string
  formSectionOrder: number
  questions: QuestionToAnswer[]
}

export interface FormToAnswer {
  sFormId: number
  sFormName: string
  sections: SectionToAnswer[]
}
