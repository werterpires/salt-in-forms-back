import { randomBytes } from 'crypto'
import { CreateCandidate } from './types'

/**
 * Gera um código de acesso único para formulário
 *
 * @returns Código de acesso de 45 caracteres
 */
export function createAccessCode(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = randomBytes(32).toString('base64url')
  const inviteCode = (timestamp + randomPart).slice(0, 45)
  return inviteCode
}

/**
 * Formata uma data string para o formato YYYY-MM-DD
 * Aceita formatos: DD/MM/YYYY ou YYYY-MM-DD
 *
 * @param dateString - String com a data a ser formatada
 * @returns Data no formato YYYY-MM-DD ou string vazia se inválida
 */
export function formatDateString(dateString: string): string {
  if (!dateString) return ''

  // Se já está no formato YYYY-MM-DD, retorna
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }

  // Se está no formato DD/MM/YYYY, converte
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('/')
    return `${year}-${month}-${day}`
  }

  return dateString
}

/**
 * Verifica se um candidato é estrangeiro baseado no valor do campo
 *
 * @param estrangeiroValue - Valor do campo "estrangeiro" da API
 * @returns true se for estrangeiro, false caso contrário
 */
export function isForeignerCandidate(estrangeiroValue: string): boolean {
  return estrangeiroValue === 'Sim'
}

/**
 * Extrai e mapeia os campos da API para um objeto chave-valor
 *
 * @param attributes - Array de atributos da API
 * @returns Objeto com os campos mapeados
 */
export function extractFieldsFromApiResponse(
  attributes: any[]
): Record<string, string> {
  const fieldMap: Record<string, string> = {}

  attributes.forEach((attr) => {
    const label = attr.Label.toLowerCase()
    const value =
      attr.Values && attr.Values.length > 0 ? attr.Values[0].Caption : ''
    fieldMap[label] = value
  })

  return fieldMap
}

/**
 * Transforma um item da resposta da API em um objeto CreateCandidate
 *
 * @param apiItem - Item da API contendo dados do candidato
 * @param processId - ID do processo
 * @param encryptionService - Serviço de criptografia para dados sensíveis
 * @returns Objeto CreateCandidate ou null se houver erro
 */
export function transformApiItemToCandidate(
  apiItem: any,
  processId: number,
  encryptionService: { encrypt: (value: string) => string }
): CreateCandidate | null {
  try {
    const attributes = JSON.parse(apiItem.attributes)
    const fieldMap = extractFieldsFromApiResponse(attributes)

    // Determinar se é estrangeiro
    const estrangeiroValue =
      fieldMap['estrangeiro ?'] || fieldMap['estrangeiro']
    const isForeigner = isForeignerCandidate(estrangeiroValue)

    const candidate: CreateCandidate = {
      processId: processId,
      candidateName: encryptionService.encrypt(
        fieldMap['nome completo'] || fieldMap['nome'] || ''
      ),
      candidateUniqueDocument: isForeigner
        ? fieldMap['n° passaporte'] || fieldMap['passaporte'] || ''
        : fieldMap['cpf'] || '',
      candidateEmail: encryptionService.encrypt(
        fieldMap['e-mail'] || fieldMap['email'] || ''
      ),
      candidatePhone: encryptionService.encrypt(
        fieldMap['telefone'] || fieldMap['phone'] || ''
      ),
      candidateBirthdate: encryptionService.encrypt(
        formatDateString(
          fieldMap['data de nascimento'] || fieldMap['nascimento'] || ''
        )
      ),
      candidateForeigner: isForeigner,
      candidateAddress: encryptionService.encrypt(
        fieldMap['endereço'] || fieldMap['endereco'] || ''
      ),
      candidateAddressNumber: encryptionService.encrypt(
        fieldMap['número'] || fieldMap['numero'] || ''
      ),
      candidateDistrict: encryptionService.encrypt(fieldMap['bairro'] || ''),
      candidateCity: encryptionService.encrypt(fieldMap['cidade'] || ''),
      candidateState: encryptionService.encrypt(fieldMap['estado'] || ''),
      candidateZipCode: encryptionService.encrypt(fieldMap['cep'] || ''),
      candidateCountry: encryptionService.encrypt('')
    }

    return candidate
  } catch (error) {
    console.error('Erro ao processar item da API:', error.message, apiItem)
    return null
  }
}

/**
 * Calcula a diferença em horas entre duas datas
 *
 * @param date1 - Primeira data
 * @param date2 - Segunda data
 * @returns Diferença em horas
 */
export function getHoursDifference(date1: Date, date2: Date): number {
  return (date2.getTime() - date1.getTime()) / (1000 * 60 * 60)
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
