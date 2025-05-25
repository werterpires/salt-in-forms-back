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
