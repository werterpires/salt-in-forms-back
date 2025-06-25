export interface FormSection {
  formSectionId: number
  sFormId: number
  formSectionName: string
  formSectionOrder: number
  formSectionDisplayRule: number
  formSectionDisplayLink?: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateFormSection {
  sFormId: number
  formSectionName: string
  formSectionOrder: number
  formSectionDisplayRule: number
  formSectionDisplayLink?: number
}

export interface UpdateFormSection {
  formSectionId: number
  formSectionName: string
  formSectionDisplayRule: number
  formSectionDisplayLink?: number
}
