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
