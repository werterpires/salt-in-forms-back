export type DocumentType = 'CPF' | 'PASSPORT' | 'OTHER'

export interface Candidate {
  candidateId: number
  processId: number
  candidateName: string
  candidateUniqueDocument: string
  candidateDocumentType: DocumentType
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
  candidateDocumentType: DocumentType
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

import { AnswerWithoutId } from '../answers/types'

export interface QuestionToAnswer {
  questionId: number
  questionOrder: number
  questionType: number
  questionStatement: string
  questionDescription: string
  options: QuestionOptionToAnswer[]
  validations: ValidationToAnswer[]
  subQuestions: SubQuestionToAnswer[]
  dependentQuestions: DependentQuestion[]
  dependentSections: DependentSection[]
  answer: AnswerWithoutId
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

export interface DependentSection {
  formSectionId: number
  formSectionDisplayRule: number
  answerDisplayRule: number
  answerDisplayValue: string
}

export interface DependentQuestion {
  questionId: number
  questionDisplayRule: number
  answerDisplayRule: number
  answerDisplayValue: string
}

export interface ProcessInAnswerPeriod {
  processId: number
  processTitle: string
}

export interface SFormBasic {
  sFormId: number
  sFormType: string
  emailQuestionId?: number | null
}

export interface FormCandidateWithDetails {
  formCandidateId: number
  candidateId: number
  sFormId: number
  formCandidateAccessCode: string
  candidateName: string
  candidateEmail: string
  sFormType: string
}

/**
 * Contexto completo para processar formCandidates ministeriais
 * Retorna todas as informações necessárias em uma única query
 */
export interface MinisterialFormCandidateContext {
  formCandidateId: number
  candidateId: number
  sFormId: number
  emailQuestionId: number
  formCandidateAccessCode: string
  candidateName: string
  candidateFormCandidateIds: number[] // Todos os formCandidateIds do mesmo candidato
}

/**
 * Contexto para processar formCandidates do tipo "normal"
 * Versão simplificada sem necessidade de agregar formCandidateIds
 */
export interface NormalFormCandidateContext {
  formCandidateId: number
  candidateId: number
  sFormId: number
  emailQuestionId: number
  formCandidateAccessCode: string
  candidateName: string
  // Todos os formCandidateIds do candidato para buscar a resposta
  candidateFormCandidateIds: number[]
}

/**
 * Candidato Pendente (aguardando confirmação de email)
 */
export interface PendingCandidate {
  pendingCandidateId: number
  candidateName: string
  candidateEmail: string
  candidateDocumentType: DocumentType
  candidateUniqueDocument: string
  candidatePhone: string
  orderCode: string
  processId: number
  confirmationToken: string
  tokenExpiresAt: Date
  attemptCount: number
  createdAt: Date
  confirmedAt: Date | null
  invalidatedAt: Date | null
}

/**
 * Dados para criar um candidato pendente
 */
export interface CreatePendingCandidate {
  candidateName: string
  candidateEmail: string
  candidateDocumentType: DocumentType
  candidateUniqueDocument: string
  candidatePhone: string
  orderCode: string
  processId: number
  confirmationToken: string
  tokenExpiresAt: Date
  attemptCount?: number
}

/**
 * Dados para inserir candidato completo (com todos os campos)
 */
export interface InsertCompleteCandidate {
  processId: number
  candidateName: string
  candidateDocumentType: DocumentType
  candidateUniqueDocument: string
  candidateEmail: string
  candidatePhone: string
  candidateOrderCode: string
  candidateBirthdate: string
  candidateForeigner: boolean
  candidateAddress: string
  candidateAddressNumber: string
  candidateDistrict: string
  candidateCity: string
  candidateState: string
  candidateZipCode: string
  candidateCountry: string
  candidateMaritalStatus: string
}

/**
 * Dados para atualizar um candidato pendente
 */
export interface UpdatePendingCandidate {
  pendingCandidateId: number
  confirmationToken?: string
  tokenExpiresAt?: Date
  attemptCount?: number
  confirmedAt?: Date
  invalidatedAt?: Date
}

/**
 * Estrutura de resposta da API de autenticação
 */
export interface AuthenticationResponse {
  authenticated: boolean
  created: string
  expiration: string
  user: {
    id: string
    name: string
    email: string
    emailConfirmed: boolean
    avatar: { id: string | null }
    tenants: string[]
    roles: string[]
  }
  token: string
  refreshToken: string
  message: string
}

/**
 * Estrutura de um item de pedido
 */
export interface OrderItem {
  orderItemId: string
  orderId: string
  enrollmentModelId: string
  enrollmentModelTitle: string
  attributes: string
  dataKey: string
  price: number
  totalValue: number
}

/**
 * Estrutura de um pagamento
 */
export interface OrderPayment {
  orderPaymentId: string
  orderId: string
  paidValue: number
  dueDate: string
  creationDate: string
  paymentDate: string | null
  paymentStatus: number
  paymentMethodCode: number
  pluginReceivedData: string
  pluginTransactionId: string
}

/**
 * Estrutura de um pedido completo
 */
export interface Order {
  orderId: string
  orderCode: number
  customerId: string
  customerName: string
  creationDate: string
  totalValue: number
  orderStatus: number
  dataKey: string
  orderItems: OrderItem[]
  orderPayments: OrderPayment[]
}

/**
 * Estrutura de resposta da API de pedidos
 */
export interface GetOrdersResponse {
  currentPageNumber: number
  pageSize: number
  validPage: boolean
  totalPages: number
  entities: Order[]
}

/**
 * Informações sobre o formulário do candidato
 */
export interface CandidateFormInfo {
  formTitle: string
  formStatus: number | null
}

/**
 * Informações básicas do candidato para listagem
 */
export interface CandidateBasicInfo {
  candidateId: number
  candidateName: string
  candidateUniqueDocument: string
  candidateDocumentType: DocumentType
  candidateEmail: string
  candidatePhone: string
  candidateBirthdate: string
  candidateMaritalStatus: string
  interviewer: string | null
  forms: CandidateFormInfo[]
}

export interface CandidateIdentification {
  candidateId: number
  candidateName: string
  candidateEmail: string
  candidateUniqueDocument: string
}
