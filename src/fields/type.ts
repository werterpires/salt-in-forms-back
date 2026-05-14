export interface FieldWithUnion {
  fieldId: number
  fieldName: string
  fieldAcronym: string
  unionId: number
  unionName: string
  unionAcronym: string
}

export interface FieldWithMinisterial extends FieldWithUnion {
  ministerialId: number | null
  ministerialName: string | null
  ministerialPrimaryPhone: string | null
  ministerialSecondaryPhone: string | null
  ministerialLandlinePhone: string | null
  ministerialPrimaryEmail: string | null
  ministerialAlternativeEmail: string | null
  ministerialSecretaryName: string | null
  ministerialSecretaryPhone: string | null
  ministerialActive: boolean | null
}

export interface FieldsWithMinisterialsFilter {
  fieldName?: string
  unionId?: number
}
