
export interface CreateMinisterial {
  ministerialName: string
  ministerialPrimaryPhone?: string
  ministerialSecondaryPhone?: string
  ministerialLandlinePhone?: string
  ministerialPrimaryEmail?: string
  ministerialAlternativeEmail?: string
  ministerialSecretaryName?: string
  ministerialSecretaryPhone?: string
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
