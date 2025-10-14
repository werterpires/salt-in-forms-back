
export interface CreateMinisterial {
  ministerialName: string
  ministerialPrimaryPhone?: string
  ministerialSecondaryPhone?: string
  ministerialLandlinePhone?: string
  ministerialPrimaryEmail?: string
  ministerialAlternativeEmail?: string
  ministerialSecretaryName?: string
  ministerialSecretaryPhone?: string
  ministerialActive?: boolean
  fieldId?: number
}

export interface Ministerial extends CreateMinisterial {
  ministerialId: number
}

export interface CreateField {
  fieldName: string
  fieldAcronym: string
  unionId?: number
}

export interface Field extends CreateField {
  fieldId: number
}

export interface CreateUnion {
  unionName: string
  unionAcronym: string
}

export interface Union extends CreateUnion {
  unionId: number
}

export interface MinisterialsFilter {
  ministerialName?: string
  fieldId?: number
  unionId?: number
}

export interface MinisterialWithRelations {
  ministerialId: number
  ministerialName: string
  ministerialPrimaryPhone?: string
  ministerialSecondaryPhone?: string
  ministerialLandlinePhone?: string
  ministerialPrimaryEmail?: string
  ministerialAlternativeEmail?: string
  ministerialSecretaryName?: string
  ministerialSecretaryPhone?: string
  ministerialCreatedAt: Date
  fieldId: number
  fieldName: string
  fieldAcronym: string
  unionId: number
  unionName: string
  unionAcronym: string
}

export interface CreateMinisterialsTransaction {
  unions: Array<{
    unionName: string
    unionAcronym: string
    fields: Array<{
      fieldName: string
      fieldAcronym: string
      ministerial: CreateMinisterial
    }>
  }>
}
