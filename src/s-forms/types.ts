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

export type SFormType = 'candidate' | 'ministerial' | 'normal'

export interface SFormFilter {
  sFormName?: string
  sFormType?: SFormType
}

export interface SFormToValidate {
  sFormId: number
  sFormType: SFormType
}
