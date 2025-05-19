export interface Paginator<T extends { [key: string]: string }> {
  column: T[keyof T]
  direction: 'asc' | 'desc'
  page: number
}

// export interface Paginator {
//   column: string
//   direction: Direction
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
