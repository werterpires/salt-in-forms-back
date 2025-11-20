import { randomBytes } from 'crypto'
import { CreateAnswer } from '../answers/types'
import { CreateAnswerDto } from '../answers/dto/create-answer.dto'

/**
 * Transforma CreateAnswerDto em CreateAnswer
 */
export function transformCreateAnswerDto(
  createAnswerDto: CreateAnswerDto,
  formCandidateId: number
): CreateAnswer {
  return {
    questionId: createAnswerDto.questionId,
    formCandidateId: formCandidateId,
    answerValue: createAnswerDto.answerValue,
    validAnswer: true
  }
}

/**
 * Gera um código de acesso único para formulário
 *
 * @returns Código de acesso de 45 caracteres
 */
export function createAccessCode(): string {
  const timestamp = Date.now().toString(36).padStart(9, '0') // sempre 9 chars
  const randomPart = randomBytes(32).toString('base64url')
  return (timestamp + randomPart).slice(0, 45)
}

/**
 * Valida e obtém a URL do frontend do ambiente
 *
 * @returns URL do frontend
 * @throws Error se FRONTEND_URL não estiver definida
 */
export function getFrontendUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL

  if (!frontendUrl) {
    throw new Error('#FRONTEND_URL não está definido no .env')
  }

  return frontendUrl
}

/**
 * Gera o link de acesso ao formulário
 *
 * @param frontendUrl - URL base do frontend
 * @param accessCode - Código de acesso
 * @returns URL completa para acesso ao formulário
 */
export function generateFormAccessLink(
  frontendUrl: string,
  accessCode: string
): string {
  return `${frontendUrl}/${accessCode}`
}

/**
 * Descriptografa dados do candidato
 *
 * @param candidateName - Nome criptografado
 * @param candidateEmail - Email criptografado
 * @param encryptionService - Serviço de criptografia
 * @returns Objeto com nome e email descriptografados
 */
export function decryptCandidateData(
  candidateName: string,
  candidateEmail: string,
  encryptionService: { decrypt: (value: string) => string }
): { name: string; email: string } {
  return {
    name: encryptionService.decrypt(candidateName),
    email: encryptionService.decrypt(candidateEmail)
  }
}

/**
 * Prepara dados de email para candidato do tipo "candidate"
 *
 * @param candidateName - Nome criptografado
 * @param candidateEmail - Email criptografado
 * @param accessCode - Código de acesso
 * @param frontendUrl - URL do frontend
 * @param encryptionService - Serviço de criptografia
 * @param emailTemplate - Função que gera o template (first-access ou resend)
 * @returns Objeto com dados prontos para envio
 */
export function prepareCandidateEmailData(
  candidateName: string,
  candidateEmail: string,
  accessCode: string,
  frontendUrl: string,
  encryptionService: { decrypt: (value: string) => string },
  emailTemplate: (name: string, link: string, code: string) => string
): { recipientName: string; recipientEmail: string; html: string } {
  const { name, email } = decryptCandidateData(
    candidateName,
    candidateEmail,
    encryptionService
  )
  const accessLink = generateFormAccessLink(frontendUrl, accessCode)
  const html = emailTemplate(name, accessLink, accessCode)

  return {
    recipientName: name,
    recipientEmail: email,
    html
  }
}
