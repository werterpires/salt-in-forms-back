import { BadRequestException } from '@nestjs/common'
import { ValidationSpcification } from './types'

// Retorna true se value for undefined, null ou string vazia
function isNilOrEmpty(value: any): boolean {
  return value === undefined || value === null || value === ''
}

export interface validationResult {
  isValid: boolean
  errorMessage: string
}

function isValidISODateString(str: string): boolean {
  // formato: YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(str)) return false

  // valida se a data realmente existe (ex: 2025-02-30 não existe)
  const [y, m, d] = str.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  )
}

export const greaterThanOrEqual: ValidationSpcification = {
  validationType: 1,
  validationName: 'Maior ou igual a',
  validationDescription:
    'Verifica se o valor é maior ou igual ao valor  especificado',
  valueOneType: 'number',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    const minValue = Number(val1)
    if (
      typeof minValue !== 'number' ||
      isNaN(minValue) ||
      val2 ||
      val3 ||
      val4
    ) {
      throw new Error(
        'Parâmetros inválidos para a validação "Maior ou igual a"'
      )
    }

    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    if (typeof value !== 'number') {
      value = parseFloat(value)
    }

    if (isNaN(value)) {
      return { isValid: false, errorMessage: 'O valor deve ser um número' }
    }
    const isValid = value >= minValue
    return isValid
      ? { isValid: true, errorMessage: '' }
      : {
          isValid: false,
          errorMessage: `O valor deve ser maior ou igual a ${minValue}`
        }
  }
}

export const greaterThan: ValidationSpcification = {
  validationType: 2,
  validationName: 'Maior que',
  validationDescription: 'Verifica se o valor é maior que o valor especificado',
  valueOneType: 'number',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    const min = Number(val1)
    if (typeof min !== 'number' || isNaN(min) || val2 || val3 || val4) {
      throw new Error('Parâmetros inválidos para a validação "Maior que"')
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    if (typeof value !== 'number') value = parseFloat(value)
    if (isNaN(value))
      return { isValid: false, errorMessage: 'O valor deve ser um número' }
    return value > min
      ? { isValid: true, errorMessage: '' }
      : { isValid: false, errorMessage: `O valor deve ser maior que ${min}` }
  }
}

export const lessThanOrEqual: ValidationSpcification = {
  validationType: 3,
  validationName: 'Menor ou igual a',
  validationDescription:
    'Verifica se o valor é menor ou igual ao valor especificado',
  valueOneType: 'number',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    const max = Number(val1)
    if (typeof max !== 'number' || isNaN(max) || val2 || val3 || val4) {
      throw new Error(
        'Parâmetros inválidos para a validação "Menor ou igual a"'
      )
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    if (typeof value !== 'number') value = parseFloat(value)
    if (isNaN(value))
      return { isValid: false, errorMessage: 'O valor deve ser um número' }
    return value <= max
      ? { isValid: true, errorMessage: '' }
      : {
          isValid: false,
          errorMessage: `O valor deve ser menor ou igual a ${max}`
        }
  }
}

export const lessThan: ValidationSpcification = {
  validationType: 4,
  validationName: 'Menor que',
  validationDescription: 'Verifica se o valor é menor que o valor especificado',
  valueOneType: 'number',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    const max = Number(val1)
    if (typeof max !== 'number' || isNaN(max) || val2 || val3 || val4) {
      throw new Error('Parâmetros inválidos para a validação "Menor que"')
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    if (typeof value !== 'number') value = parseFloat(value)
    if (isNaN(value))
      return { isValid: false, errorMessage: 'O valor deve ser um número' }
    return value < max
      ? { isValid: true, errorMessage: '' }
      : { isValid: false, errorMessage: `O valor deve ser menor que ${max}` }
  }
}

export const required: ValidationSpcification = {
  validationType: 5,
  validationName: 'Obrigatório',
  validationDescription: 'Verifica se o valor existe',
  valueOneType: 'undefined',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    if (val1 || val2 || val3 || val4) {
      throw new Error('Parâmetros inválidos para a validação "Obrigatório"')
    }
    const ok = value !== undefined && value !== null && value !== ''
    return ok
      ? { isValid: true, errorMessage: '' }
      : { isValid: false, errorMessage: 'Campo obrigatório' }
  }
}

export const minLength: ValidationSpcification = {
  validationType: 6,
  validationName: 'Tamanho mínimo',
  validationDescription:
    'Verifica se o tamanho do valor é maior ou igual ao mínimo especificado',
  valueOneType: 'number',
  valueTwoType: 'number',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    const min = Number(val1)
    if (typeof min !== 'number' || isNaN(min) || val2 || val3 || val4) {
      throw new Error('Parâmetros inválidos para a validação "Tamanho mínimo"')
    }
    //remove todos os espaços em branco do início e do fim da string e deixa só um espaço entre as palavras

    if (typeof value !== 'string')
      return { isValid: false, errorMessage: 'O valor deve ser um texto' }

    value = value.trim().replace(/\s+/g, ' ')

    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }

    return value.length >= min
      ? { isValid: true, errorMessage: '' }
      : {
          isValid: false,
          errorMessage: `O tamanho mínimo é ${min} caracteres, e atualmente possui apenas ${value.length}.`
        }
  }
}

export const maxLength: ValidationSpcification = {
  validationType: 7,
  validationName: 'Tamanho máximo',
  validationDescription:
    'Verifica se o tamanho do valor é menor ou igual ao máximo especificado',
  valueOneType: 'number',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    const max = Number(val1)
    if (typeof max !== 'number' || isNaN(max) || val2 || val3 || val4) {
      throw new Error('Parâmetros inválidos para a validação "Tamanho máximo"')
    }
    if (typeof value !== 'string')
      return { isValid: false, errorMessage: 'O valor deve ser uma string' }
    value = value.trim().replace(/\s+/g, ' ')
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }

    return value.length <= max
      ? { isValid: true, errorMessage: '' }
      : {
          isValid: false,
          errorMessage: `O tamanho máximo é ${max} caracteres, e atualmente possui ${value.length}.`
        }
  }
}

export const isEmail: ValidationSpcification = {
  validationType: 8,
  validationName: 'Email válido',
  validationDescription: 'Verifica se o valor é um email válido',
  valueOneType: 'undefined',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    if (val1 || val2 || val3 || val4) {
      throw new Error('Parâmetros inválidos para a validação "Email válido"')
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    if (typeof value !== 'string')
      return { isValid: false, errorMessage: 'O valor deve ser uma string' }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
      ? { isValid: true, errorMessage: '' }
      : { isValid: false, errorMessage: 'Email inválido' }
  }
}

export const isUrl: ValidationSpcification = {
  validationType: 9,
  validationName: 'URL válida',
  validationDescription: 'Verifica se o valor é uma URL válida',
  valueOneType: 'undefined',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    if (val1 || val2 || val3 || val4) {
      throw new Error('Parâmetros inválidos para a validação "URL válida"')
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    if (typeof value !== 'string')
      return { isValid: false, errorMessage: 'O valor deve ser uma string' }
    value = value.trim()
    const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-zA-Z]{2,})([/\w.-]*)*\/?$/
    if (!urlPattern.test(value)) {
      return { isValid: false, errorMessage: 'URL inválida' }
    }
    try {
      new URL(value)
      return { isValid: true, errorMessage: '' }
    } catch {
      return { isValid: false, errorMessage: 'URL inválida' }
    }
  }
}

export const valueBetweenInclusive: ValidationSpcification = {
  validationType: 10,
  validationName: 'Valor entre (inclusivo)',
  validationDescription:
    'Verifica se o valor está entre os valores especificados (inclusivo)',
  valueOneType: 'number',
  valueTwoType: 'number',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    const min = Number(val1)
    const max = Number(val2)
    if (
      typeof min !== 'number' ||
      isNaN(min) ||
      typeof max !== 'number' ||
      isNaN(max) ||
      val3 ||
      val4
    ) {
      throw new Error(
        'Parâmetros inválidos para a validação "Valor entre (inclusivo)"'
      )
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    const num = Number(value)
    if (isNaN(num))
      return { isValid: false, errorMessage: 'O valor deve ser um número' }
    return num >= min && num <= max
      ? { isValid: true, errorMessage: '' }
      : {
          isValid: false,
          errorMessage: `Escolha um valor numérico de ${min} a ${max}`
        }
  }
}

export const valueBetweenExclusive: ValidationSpcification = {
  validationType: 11,
  validationName: 'Valor entre (exclusivo)',
  validationDescription:
    'Verifica se o valor está entre os valores especificados (exclusivo)',
  valueOneType: 'number',
  valueTwoType: 'number',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    const min = Number(val1)
    const max = Number(val2)
    if (
      typeof min !== 'number' ||
      isNaN(min) ||
      typeof max !== 'number' ||
      isNaN(max) ||
      val3 ||
      val4
    ) {
      throw new Error(
        'Parâmetros inválidos para a validação "Valor entre (exclusivo)"'
      )
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    const num = Number(value)
    if (isNaN(num))
      return { isValid: false, errorMessage: 'O valor deve ser um número' }
    return num > min && num < max
      ? { isValid: true, errorMessage: '' }
      : {
          isValid: false,
          errorMessage: `O valor deve ser maior que ${min} e menor que ${max}`
        }
  }
}

export const minDate: ValidationSpcification = {
  validationType: 12,
  validationName: 'Data mínima',
  validationDescription:
    'Verifica se a data é maior ou igual à data mínima especificada',
  valueOneType: 'string',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    if (typeof val1 !== 'string' || val2 || val3 || val4) {
      throw new Error('Parâmetros inválidos para a validação "Data mínima"')
    }
    if (!isValidISODateString(val1)) {
      return { isValid: false, errorMessage: 'Validação mal formatada' }
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    if (!isValidISODateString(value)) {
      return {
        isValid: false,
        errorMessage: 'O valor deve ser uma data válida'
      }
    }

    return value >= val1
      ? { isValid: true, errorMessage: '' }
      : {
          isValid: false,
          errorMessage: `A data deve ser maior ou igual a ${val1}`
        }
  }
}

export const maxDate: ValidationSpcification = {
  validationType: 13,
  validationName: 'Data máxima',
  validationDescription:
    'Verifica se a data é menor ou igual à data máxima especificada',
  valueOneType: 'string',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    if (typeof val1 !== 'string' || val2 || val3 || val4) {
      throw new Error('Parâmetros inválidos para a validação "Data máxima"')
    }
    if (!isValidISODateString(val1)) {
      return { isValid: false, errorMessage: 'Validação mal formatada' }
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    if (!isValidISODateString(value)) {
      return {
        isValid: false,
        errorMessage: 'O valor deve ser uma data válida'
      }
    }

    return value <= val1
      ? { isValid: true, errorMessage: '' }
      : {
          isValid: false,
          errorMessage: `A data deve ser menor ou igual a ${val1}`
        }
  }
}

export const isDate: ValidationSpcification = {
  validationType: 14,
  validationName: 'Data válida',
  validationDescription: 'Verifica se o valor é uma data válida',
  valueOneType: 'undefined',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    if (val1 || val2 || val3 || val4) {
      throw new Error('Parâmetros inválidos para a validação "Data válida"')
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    return isValidISODateString(value)
      ? { isValid: true, errorMessage: '' }
      : { isValid: false, errorMessage: 'Data inválida' }
  }
}

export const isDateBetweenInclusive: ValidationSpcification = {
  validationType: 15,
  validationName: 'Data entre (inclusivo)',
  validationDescription:
    'Verifica se a data está entre as datas especificadas (inclusivo)',
  valueOneType: 'string',
  valueTwoType: 'string',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    if (typeof val1 !== 'string' || typeof val2 !== 'string' || val3 || val4) {
      throw new Error(
        'Parâmetros inválidos para a validação "Data entre (inclusivo)"'
      )
    }
    if (!isValidISODateString(val1) || !isValidISODateString(val2)) {
      return { isValid: false, errorMessage: 'Validação mal formatada' }
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }

    if (!isValidISODateString(value)) {
      return {
        isValid: false,
        errorMessage: 'O valor deve ser uma data válida'
      }
    }
    return value >= val1 && value <= val2
      ? { isValid: true, errorMessage: '' }
      : {
          isValid: false,
          errorMessage: `Escolha uma data de ${val1} até ${val2}`
        }
  }
}

export const isDateBetweenExclusive: ValidationSpcification = {
  validationType: 16,
  validationName: 'Data entre (exclusivo)',
  validationDescription:
    'Verifica se a data está entre as datas especificadas (exclusivo)',
  valueOneType: 'string',
  valueTwoType: 'string',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    if (typeof val1 !== 'string' || typeof val2 !== 'string' || val3 || val4) {
      throw new Error(
        'Parâmetros inválidos para a validação "Data entre (exclusivo)"'
      )
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }

    if (!isValidISODateString(val1) || !isValidISODateString(val2)) {
      return { isValid: false, errorMessage: 'Validação mal formatada' }
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }

    if (!isValidISODateString(value)) {
      return {
        isValid: false,
        errorMessage: 'O valor deve ser uma data válida'
      }
    }
    return value > val1 && value < val2
      ? { isValid: true, errorMessage: '' }
      : {
          isValid: false,
          errorMessage: `Escolha uma data entre ${val1} e ${val2}`
        }
  }
}

export const minAge: ValidationSpcification = {
  validationType: 17,
  validationName: 'Idade mínima',
  validationDescription:
    'Verifica se a idade calculada a partir da data de nascimento é maior ou igual à idade mínima especificada',
  valueOneType: 'number',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    const minAge = Number(val1)
    if (
      typeof val1 === 'undefined' ||
      typeof minAge !== 'number' ||
      isNaN(minAge) ||
      val2 ||
      val3 ||
      val4
    ) {
      throw new Error('Parâmetros inválidos para a validação "Idade mínima"')
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }

    if (!isValidISODateString(value)) {
      return {
        isValid: false,
        errorMessage: 'O valor deve ser uma data válida no formato YYYY-MM-DD'
      }
    }

    const birthDate = new Date(value)
    const today = new Date()

    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--
    }

    const isValid = age >= minAge
    return isValid
      ? { isValid: true, errorMessage: '' }
      : { isValid: false, errorMessage: `A idade mínima é ${minAge} anos` }
  }
}

export const maxAge: ValidationSpcification = {
  validationType: 18,
  validationName: 'Idade máxima',
  validationDescription:
    'Verifica se a idade calculada a partir da data de nascimento é menor ou igual à idade máxima especificada',
  valueOneType: 'number',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    const maxAge = Number(val1)
    if (
      typeof val1 === 'undefined' ||
      typeof maxAge !== 'number' ||
      isNaN(maxAge) ||
      val2 ||
      val3 ||
      val4
    ) {
      throw new Error('Parâmetros inválidos para a validação "Idade máxima"')
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }

    if (!isValidISODateString(value)) {
      return {
        isValid: false,
        errorMessage: 'O valor deve ser uma data válida no formato YYYY-MM-DD'
      }
    }

    const birthDate = new Date(value)
    const today = new Date()

    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--
    }

    const isValid = age <= maxAge
    return isValid
      ? { isValid: true, errorMessage: '' }
      : { isValid: false, errorMessage: `A idade máxima é ${maxAge} anos` }
  }
}

export const isNumeric: ValidationSpcification = {
  validationType: 19,
  validationName: 'Valor numérico',
  validationDescription: 'Verifica se o valor é numérico',
  valueOneType: 'undefined',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    if (val1 || val2 || val3 || val4) {
      throw new Error('Parâmetros inválidos para a validação "Valor numérico"')
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    if (typeof value === 'string') value = value.replace(',', '.')
    const ok = !isNaN(parseFloat(value.toString())) && isFinite(Number(value))
    return ok
      ? { isValid: true, errorMessage: '' }
      : { isValid: false, errorMessage: 'O valor deve ser numérico' }
  }
}

export const isAlpha: ValidationSpcification = {
  validationType: 20,
  validationName: 'Apenas letras',
  validationDescription: 'Verifica se o valor contém apenas letras',
  valueOneType: 'undefined',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    if (val1 || val2 || val3 || val4) {
      throw new Error('Parâmetros inválidos para a validação "Apenas letras"')
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    if (typeof value !== 'string')
      return { isValid: false, errorMessage: 'O valor deve ser uma string' }
    value = value.trim()
    const alphaRegex = /^[a-zA-Z]+$/
    return alphaRegex.test(value)
      ? { isValid: true, errorMessage: '' }
      : { isValid: false, errorMessage: 'Apenas letras são permitidas' }
  }
}

export const minWords: ValidationSpcification = {
  validationType: 21,
  validationName: 'Número mínimo de palavras',
  validationDescription:
    'Verifica se o número de palavras no valor é maior ou igual ao mínimo especificado',
  valueOneType: 'number',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    const min = Number(val1)
    if (typeof min !== 'number' || isNaN(min) || val2 || val3 || val4) {
      throw new Error(
        'Parâmetros inválidos para a validação "Número mínimo de palavras"'
      )
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    if (typeof value !== 'string')
      return { isValid: false, errorMessage: 'O valor deve ser uma string' }
    const words = value.trim().split(/\s+/)
    return words.length >= min
      ? { isValid: true, errorMessage: '' }
      : { isValid: false, errorMessage: `Número mínimo de palavras: ${min}` }
  }
}

export const maxWords: ValidationSpcification = {
  validationType: 22,
  validationName: 'Número máximo de palavras',
  validationDescription:
    'Verifica se o número de palavras no valor é menor ou igual ao máximo especificado',
  valueOneType: 'number',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    const max = Number(val1)
    if (typeof max !== 'number' || isNaN(max) || val2 || val3 || val4) {
      throw new Error(
        'Parâmetros inválidos para a validação "Número máximo de palavras"'
      )
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    if (typeof value !== 'string')
      return { isValid: false, errorMessage: 'O valor deve ser uma string' }
    const words = value.trim().split(/\s+/)
    return words.length <= max
      ? { isValid: true, errorMessage: '' }
      : { isValid: false, errorMessage: `Número máximo de palavras: ${max}.` }
  }
}

export const isAlphaSpace: ValidationSpcification = {
  validationType: 23,
  validationName: 'Apenas letras e espaços',
  validationDescription: 'Verifica se o valor contém apenas letras e espaços',
  valueOneType: 'undefined',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    if (val1 || val2 || val3 || val4) {
      throw new Error(
        'Parâmetros inválidos para a validação "Apenas letras e espaços"'
      )
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    if (typeof value !== 'string')
      return { isValid: false, errorMessage: 'O valor deve ser uma string' }
    value = value.trim()
    const alphaSpaceRegex = /^[a-zA-Z\s]+$/
    return alphaSpaceRegex.test(value)
      ? { isValid: true, errorMessage: '' }
      : {
          isValid: false,
          errorMessage:
            'Apenas letras e espaços são permitidos (Números e símbolos não).'
        }
  }
}

export const isAlphaNumeric: ValidationSpcification = {
  validationType: 24,
  validationName: 'Apenas letras e números',
  validationDescription: 'Verifica se o valor contém apenas letras e números',
  valueOneType: 'undefined',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    if (val1 || val2 || val3 || val4) {
      throw new Error(
        'Parâmetros inválidos para a validação "Apenas letras e números"'
      )
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    if (typeof value !== 'string')
      return { isValid: false, errorMessage: 'O valor deve ser uma string' }
    value = value.trim()
    const alphaNumericRegex = /^[a-zA-Z0-9]+$/
    return alphaNumericRegex.test(value)
      ? { isValid: true, errorMessage: '' }
      : {
          isValid: false,
          errorMessage:
            'Apenas letras e números são permitidos (espaços e símbolos não)'
        }
  }
}

export const isFutureDate: ValidationSpcification = {
  validationType: 25,
  validationName: 'Data futura',
  validationDescription: 'Verifica se a data é uma data futura',
  valueOneType: 'undefined',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    if (val1 !== undefined || val2 || val3 || val4) {
      throw new Error('Parâmetros inválidos para a validação "Data futura"')
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    const dateValue = new Date(value)
    const today = new Date()
    if (isNaN(dateValue.getTime()))
      return {
        isValid: false,
        errorMessage: 'O valor deve ser uma data válida'
      }
    return dateValue > today
      ? { isValid: true, errorMessage: '' }
      : { isValid: false, errorMessage: 'A data deve ser no futuro' }
  }
}

export const isPastDate: ValidationSpcification = {
  validationType: 26,
  validationName: 'Data passada',
  validationDescription: 'Verifica se a data é uma data passada',
  valueOneType: 'undefined',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    if (val1 !== undefined || val2 || val3 || val4) {
      throw new Error('Parâmetros inválidos para a validação "Data passada"')
    }
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }
    const dateValue = new Date(value)
    const today = new Date()
    if (isNaN(dateValue.getTime()))
      return {
        isValid: false,
        errorMessage: 'O valor deve ser uma data válida'
      }
    return dateValue < today
      ? { isValid: true, errorMessage: '' }
      : { isValid: false, errorMessage: 'A data deve ser no passado' }
  }
}

export const isUnicEmail: ValidationSpcification = {
  validationType: 27,
  validationName: 'Email único',
  validationDescription: 'Verifica se o email é único',
  valueOneType: 'string',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (
    value: any,
    val1: any,
    val2: any,
    val3: any,
    val4: any
  ): validationResult => {
    if (typeof val1 !== 'string' || val2 || val3 || val4) {
      throw new BadRequestException(
        'Parâmetros inválidos para a validação "Email único"'
      )
    }

    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }

    if (typeof value !== 'string')
      return { isValid: false, errorMessage: 'O valor deve ser uma string' }

    // val1 contém todos os emails já utilizados pelo candidato, separados por ||
    const usedEmails = val1
      ? val1.split('||').map((email: string) => email.trim().toLowerCase())
      : []
    const currentEmail = value.trim().toLowerCase()

    const isEmailAlreadyUsed = usedEmails.includes(currentEmail)

    return isEmailAlreadyUsed
      ? {
          isValid: false,
          errorMessage: 'Este email já foi utilizado em outro formulário'
        }
      : { isValid: true, errorMessage: '' }
  }
}

export const VALIDATION_SPECIFICATIONS_BY_TYPE: Record<
  number,
  ValidationSpcification
> = {}
;[
  greaterThanOrEqual,
  greaterThan,
  lessThanOrEqual,
  lessThan,
  required,
  minLength,
  maxLength,
  isEmail,
  isUrl,
  valueBetweenInclusive,
  valueBetweenExclusive,
  minDate,
  maxDate,
  isDate,
  isDateBetweenInclusive,
  isDateBetweenExclusive,
  minAge,
  maxAge,
  isNumeric,
  isAlpha,
  minWords,
  maxWords,
  isAlphaSpace,
  isAlphaNumeric,
  isFutureDate,
  isPastDate,
  isUnicEmail
].forEach((spec) => {
  VALIDATION_SPECIFICATIONS_BY_TYPE[spec.validationType] = spec
})
