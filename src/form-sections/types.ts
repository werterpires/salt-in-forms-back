export interface FormSection {
  formSectionId: number
  sFormId: number
  formSectionName: string
  formSectionOrder: number
  formSectionDisplayRule: number
  formSectionDisplayLink?: number
  questionDisplayLink?: number
  answerDisplayRule?: number
  answerDisplayValue?: string | number[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateFormSection {
  sFormId: number
  formSectionName: string
  formSectionOrder: number
  formSectionDisplayRule: number
  formSectionDisplayLink?: number
  questionDisplayLink?: number
  answerDisplayRule?: number
  answerDisplayValue?: string
}

export interface UpdateFormSection {
  formSectionId: number
  formSectionName: string
  formSectionDisplayRule: number
  formSectionDisplayLink?: number | null
  questionDisplayLink?: number | null
  answerDisplayRule?: number | null
  answerDisplayValue?: string | null
}

export interface FormSectionWithDisplayRules {
  formSectionId: number
  formSectionOrder: number
  formSectionName: string
  formSectionDisplayRule: number
  answerDisplayRule?: number
  answerDisplayValue?: string | number[]
}
