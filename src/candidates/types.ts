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
  created_at: Date
  updated_at: Date
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
