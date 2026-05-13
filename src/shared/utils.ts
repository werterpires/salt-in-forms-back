import { BadRequestException } from '@nestjs/common'

export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, (letter) => `_${letter.toLowerCase()}`)
    .replace(/^_/, '')
}

export function getDateFromString(dateStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split('-')
  // Parse as local midnight to avoid UTC offset shifting the day
  const date = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr))

  if (isNaN(date.getTime())) {
    throw new BadRequestException('#Data inválida.')
  }

  return date
}

export function areArraysEqual(arr1: number[], arr2: number[]): boolean {
  if (arr1.length !== arr2.length) return false

  const set2 = new Set(arr2)

  return arr1.every((item) => set2.has(item))
}

// MySQL2 with timezone:'Z' returns `date` columns as UTC midnight (e.g. 2026-04-20T00:00:00Z).
// Using new Date() directly on these values causes 3-hour drift in UTC-3: a begin date of
// "Apr 20" becomes active at 21:00 Apr 19 local, and an end date of "Apr 20" expires at
// 21:00 Apr 19 local instead of 23:59 Apr 20. These helpers fix both cases by extracting
// the UTC date components and reconstructing as local time.
export function parseBeginDateFromDb(d: Date | string): Date {
  const dt = new Date(d)
  return new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 0, 0, 0, 0)
}

export function parseEndDateFromDb(d: Date | string): Date {
  const dt = new Date(d)
  return new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 23, 59, 59, 999)
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
