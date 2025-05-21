export class Paginator<T extends { [key: string]: string }> {
  column: T[keyof T]
  direction: 'asc' | 'desc'
  page: number

  constructor(
    page: number | undefined,
    direction: string,
    column: string,
    columnDefault: T[keyof T],
    tableEnum: T
  ) {
    this.page = page || 1
    this.setDirection(direction)
    this.setColumn(column, columnDefault, tableEnum)
  }

  setColumn(column: string, columnDefault: T[keyof T], tableEnum: T) {
    const valuesArray = Object.values(tableEnum)
    this.column = valuesArray.includes(column as T[keyof T])
      ? (column as T[keyof T])
      : columnDefault
  }

  setDirection(direction: string) {
    this.direction = Object.values(Direction).includes(direction as Direction)
      ? (direction as Direction)
      : Direction.ASC
  }
}

// export interface Paginator<T extends { [key: string]: string }> {
//   column: T[keyof T]
//   direction: 'asc' | 'desc'
//   page: number
// }

export enum Direction {
  ASC = 'asc',
  DESC = 'desc'
}

export interface FindAllResponse<T> {
  data: T[]
  pagesQuantity: number
}
