import { BadRequestException } from '@nestjs/common'
import { ValidationSpcification } from './types'

// Retorna true se value for undefined, null ou string vazia
function isNilOrEmpty(value: any): boolean {
  return value === undefined || value === null || value === ''
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
  validationFunction: (value: any, min: number) => {
    if (isNilOrEmpty(value)) return true
    if (typeof value !== 'number') {
      value = parseFloat(value)
    }
    if (isNaN(value)) {
      throw new BadRequestException('O valor deve ser um número')
    }
    return value >= min
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
  validationFunction: (value: any, min: number) => {
    if (isNilOrEmpty(value)) return true
    if (typeof value !== 'number') {
      value = parseFloat(value)
    }
    if (isNaN(value)) {
      throw new BadRequestException('O valor deve ser um número')
    }
    return value > min
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
  validationFunction: (value: any, max: number) => {
    if (isNilOrEmpty(value)) return true
    if (typeof value !== 'number') {
      value = parseFloat(value)
    }
    if (isNaN(value)) {
      throw new BadRequestException('O valor deve ser um número')
    }
    return value <= max
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
  validationFunction: (value: any, max: number) => {
    if (isNilOrEmpty(value)) return true
    if (typeof value !== 'number') {
      value = parseFloat(value)
    }
    if (isNaN(value)) {
      throw new BadRequestException('O valor deve ser um número')
    }
    return value < max
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
  validationFunction: (value: any) => {
    return value !== undefined && value !== null && value !== ''
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
  validationFunction: (value: any, minLength: number) => {
    if (isNilOrEmpty(value)) return true
    if (typeof value !== 'string') {
      throw new BadRequestException('O valor deve ser uma string')
    }
    return value.length >= minLength
  }
}

export const maxLength: ValidationSpcification = {
  validationType: 7,
  validationName: 'Tamanho máximo',
  validationDescription:
    'Verifica se o tamanho do valor é menor ou igual ao máximo especificado',
  valueOneType: 'number',
  valueTwoType: 'number',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (value: any, maxLength: number) => {
    if (isNilOrEmpty(value)) return true
    if (typeof value !== 'string') {
      throw new BadRequestException('O valor deve ser uma string')
    }
    return value.length <= maxLength
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
  validationFunction: (value: string) => {
    if (isNilOrEmpty(value)) return true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
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
  validationFunction: (value: string) => {
    if (isNilOrEmpty(value)) return true
    try {
      new URL(value)
      return true
    } catch {
      return false
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
  validationFunction: (value: number, min: number, max: number) => {
    if (isNilOrEmpty(value)) return true
    return value >= min && value <= max
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
  validationFunction: (value: number, min: number, max: number) => {
    if (isNilOrEmpty(value)) return true
    return value > min && value < max
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
  validationFunction: (value: string, minDate: string) => {
    if (isNilOrEmpty(value)) return true
    const dateValue = new Date(value)
    const minDateValue = new Date(minDate)
    if (isNaN(dateValue.getTime()) || isNaN(minDateValue.getTime())) {
      throw new BadRequestException('O valor deve ser uma data válida')
    }
    return dateValue >= minDateValue
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
  validationFunction: (value: string, maxDate: string) => {
    if (isNilOrEmpty(value)) return true
    const dateValue = new Date(value)
    const maxDateValue = new Date(maxDate)
    if (isNaN(dateValue.getTime()) || isNaN(maxDateValue.getTime())) {
      throw new BadRequestException('O valor deve ser uma data válida')
    }
    return dateValue <= maxDateValue
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
  validationFunction: (value: string) => {
    if (isNilOrEmpty(value)) return true
    const dateValue = new Date(value)
    return !isNaN(dateValue.getTime())
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
  validationFunction: (value: string, minDate: string, maxDate: string) => {
    if (isNilOrEmpty(value)) return true
    const dateValue = new Date(value)
    const minDateValue = new Date(minDate)
    const maxDateValue = new Date(maxDate)
    if (
      isNaN(dateValue.getTime()) ||
      isNaN(minDateValue.getTime()) ||
      isNaN(maxDateValue.getTime())
    ) {
      throw new BadRequestException('O valor deve ser uma data válida')
    }
    return dateValue >= minDateValue && dateValue <= maxDateValue
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
  validationFunction: (value: string, minDate: string, maxDate: string) => {
    if (isNilOrEmpty(value)) return true
    const dateValue = new Date(value)
    const minDateValue = new Date(minDate)
    const maxDateValue = new Date(maxDate)
    if (
      isNaN(dateValue.getTime()) ||
      isNaN(minDateValue.getTime()) ||
      isNaN(maxDateValue.getTime())
    ) {
      throw new BadRequestException('O valor deve ser uma data válida')
    }
    return dateValue > minDateValue && dateValue < maxDateValue
  }
}

export const minAge: ValidationSpcification = {
  validationType: 17,
  validationName: 'Tempo mínimo',
  validationDescription:
    'Verifica se o tempo entre a data atual e a data informada é maior ou igual à idade mínima especificada',
  valueOneType: 'string',
  valueTwoType: 'number',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (value: string, minAge: number) => {
    if (isNilOrEmpty(value)) return true
    const initialDate = new Date(value)
    const today = new Date()
    if (isNaN(initialDate.getTime())) {
      throw new BadRequestException('O valor deve ser uma data válida')
    }
    const age = today.getFullYear() - initialDate.getFullYear()
    const monthDiff = today.getMonth() - initialDate.getMonth()
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < initialDate.getDate())
    ) {
      return age >= minAge
    }
    return age > minAge
  }
}

export const maxAge: ValidationSpcification = {
  validationType: 18,
  validationName: 'Tempo máximo',
  validationDescription:
    'Verifica se o tempo entre a data atual e a data informada é menor ou igual à idade máxima especificada',
  valueOneType: 'string',
  valueTwoType: 'number',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (value: string, maxAge: number) => {
    if (isNilOrEmpty(value)) return true
    const initialDate = new Date(value)
    const today = new Date()
    if (isNaN(initialDate.getTime())) {
      throw new BadRequestException('O valor deve ser uma data válida')
    }
    const age = today.getFullYear() - initialDate.getFullYear()
    const monthDiff = today.getMonth() - initialDate.getMonth()
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < initialDate.getDate())
    ) {
      return age <= maxAge
    }
    return age < maxAge
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
  validationFunction: (value: any) => {
    if (isNilOrEmpty(value)) return true
    if (typeof value === 'string') {
      value = value.replace(',', '.')
    }
    return !isNaN(parseFloat(value.toString())) && isFinite(value)
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
  validationFunction: (value: any) => {
    if (isNilOrEmpty(value)) return true
    if (typeof value !== 'string') {
      throw new BadRequestException('O valor deve ser uma string')
    }
    value = value.trim()
    const alphaRegex = /^[a-zA-Z]+$/
    return alphaRegex.test(value)
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
  validationFunction: (value: any, minWords: number) => {
    if (isNilOrEmpty(value)) return true
    if (typeof value !== 'string') {
      throw new BadRequestException('O valor deve ser uma string')
    }
    const words = value.trim().split(/\s+/)
    return words.length >= minWords
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
  validationFunction: (value: any, maxWords: number) => {
    if (isNilOrEmpty(value)) return true
    if (typeof value !== 'string') {
      throw new BadRequestException('O valor deve ser uma string')
    }
    const words = value.trim().split(/\s+/)
    return words.length <= maxWords
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
  validationFunction: (value: any) => {
    if (isNilOrEmpty(value)) return true
    if (typeof value !== 'string') {
      throw new BadRequestException('O valor deve ser uma string')
    }
    value = value.trim()
    const alphaSpaceRegex = /^[a-zA-Z\s]+$/
    return alphaSpaceRegex.test(value)
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
  validationFunction: (value: any) => {
    if (isNilOrEmpty(value)) return true
    if (typeof value !== 'string') {
      throw new BadRequestException('O valor deve ser uma string')
    }
    value = value.trim()
    const alphaNumericRegex = /^[a-zA-Z0-9]+$/
    return alphaNumericRegex.test(value)
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
  validationFunction: (value: string) => {
    if (isNilOrEmpty(value)) return true
    const dateValue = new Date(value)
    const today = new Date()
    if (isNaN(dateValue.getTime())) {
      throw new BadRequestException('O valor deve ser uma data válida')
    }
    return dateValue > today
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
  validationFunction: (value: string) => {
    if (isNilOrEmpty(value)) return true
    const dateValue = new Date(value)
    const today = new Date()
    if (isNaN(dateValue.getTime())) {
      throw new BadRequestException('O valor deve ser uma data válida')
    }
    return dateValue < today
  }
}

export const isUnicEmail: ValidationSpcification = {
  validationType: 27,
  validationName: 'Email único',
  validationDescription: 'Verifica se o email é único',
  valueOneType: 'undefined',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (value: string, existingEmails: string[]) => {
    if (isNilOrEmpty(value)) return true
    if (typeof value !== 'string') {
      throw new BadRequestException('O valor deve ser uma string')
    }
    return !existingEmails.includes(value)
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
