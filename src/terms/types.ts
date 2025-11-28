import { ERoles } from 'src/constants/roles.const'
import { ETermsTypes } from 'src/constants/terms-types.const'

export interface CreateTerm {
  roleId: ERoles
  termTypeId: ETermsTypes
  termText: string
  beginDate: Date
}

export interface Term extends CreateTerm {
  termId: number
  endDate?: Date
}

export type UpdateTerm = Omit<Term, 'endDate'>

export interface TermFilter {
  roleId?: number
  termTypeId?: number
  onlyActive?: boolean
}
