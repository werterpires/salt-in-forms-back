export enum RoleId {
  ADMIN = 1,
  SEC = 2,
  INTERV = 3
}

export const RoleDetails: Record<RoleId, { roleName: string }> = {
  [RoleId.ADMIN]: { roleName: 'administrador' },
  [RoleId.SEC]: { roleName: 'secretaria' },
  [RoleId.INTERV]: { roleName: 'entrevistador' }
}
