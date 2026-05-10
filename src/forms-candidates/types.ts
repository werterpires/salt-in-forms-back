export interface FormCandidateToSendEmail {
  formCandidateId: number
  candidateId: number
  sFormId: number
  formCandidateAccessCode: string
  candidateName: string
  candidateEmail: string
  sFormType: string
  emailQuestionId: number | null
}
