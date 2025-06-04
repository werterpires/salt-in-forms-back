export interface CreateMinisterial {
  ministerialName: string
  ministerialField: string
  ministerialEmail: string
}

export interface Ministerial extends CreateMinisterial {
  ministerialId: number
  ministerialActive: boolean
}

export interface MinisterialsFiltar {
  ministerialName?: string
  ministerialActive?: boolean
  ministerialField?: string
  ministerialEmail?: string
}
