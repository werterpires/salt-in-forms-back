export enum ERoles {
  ADMIN = 1,
  SEC = 2,
  INTERV = 3
}

export const RoleDetails: Record<ERoles, { roleName: string }> = {
  [ERoles.ADMIN]: { roleName: 'administrador' },
  [ERoles.SEC]: { roleName: 'secretaria' },
  [ERoles.INTERV]: { roleName: 'entrevistador' }
}
