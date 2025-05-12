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
