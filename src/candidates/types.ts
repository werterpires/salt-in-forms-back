
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
  createdAt: Date
  updatedAt: Date
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
  interviewUserId?: number
}
