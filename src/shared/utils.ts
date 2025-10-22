import { BadRequestException } from '@nestjs/common'

export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, (letter) => `_${letter.toLowerCase()}`)
    .replace(/^_/, '')
}

export function getDateFromString(dateStr: string): Date {
  const date = new Date(dateStr)

  if (isNaN(date.getTime())) {
    throw new BadRequestException('#Data inválida.')
  }

  date.setDate(date.getDate() + 1)

  return date
}

export function areArraysEqual(arr1: number[], arr2: number[]): boolean {
  if (arr1.length !== arr2.length) return false

  const set2 = new Set(arr2)

  return arr1.every((item) => set2.has(item))
}

export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('/')
  if (parts.length !== 3) {
    throw new BadRequestException(
      `#A data "${dateStr}" é inválida: formato esperado é YYYY/MM/DD`
    )
  }

  const [year, month, day] = parts.map(Number)

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new BadRequestException(
      `#A data "${dateStr}" é inválida: contém valores não numéricos`
    )
  }

  if (month < 1 || month > 12) {
    throw new BadRequestException(
      `#A data "${dateStr}" é inválida: mês deve estar entre 1 e 12`
    )
  }

  if (day < 1) {
    throw new BadRequestException(
      `#A data "${dateStr}" é inválida: dia deve ser maior ou igual a 1`
    )
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  if (day > daysInMonth) {
    throw new BadRequestException(
      `#A data "${dateStr}" é inválida: o mês ${month} do ano ${year} só tem ${daysInMonth} dias`
    )
  }

  return new Date(year, month - 1, day)
}
