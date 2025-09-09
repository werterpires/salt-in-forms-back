import * as db from '../constants/db-schema.enum'

export interface CreateSForm {
  processId: number
  sFormName: string
  sFormType: SFormType
}

export interface UpdateSForm {
  sFormId: number
  sFormName: string
  sFormType: SFormType
}

export interface SForm {
  sFormId: number
  sFormName: string
  sFormType: SFormType
  processId: number
}

export const sFormTypesArray = ['candidate', 'ministerial', 'normal'] as const

// Derivar o tipo automaticamente:
export type SFormType = (typeof sFormTypesArray)[number]

export interface SFormFilter {
  sFormName?: string
  sFormType?: SFormType
}

export interface SFormToValidate {
  sFormId: number
  sFormType: SFormType
}

export interface CopySForm {
  sourceSFormId: number
  targetFormId: number
}

export interface FormCopyResult {
  newSFormId: number
  sectionsMapping: Map<number, number>
  questionsMapping: Map<number, number>
  subQuestionsMapping: Map<number, number>
}

export interface SFormSimple {
  [db.SForms.S_FORM_ID]: number
  [db.SForms.S_FORM_NAME]: string
}
