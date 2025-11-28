import { randomBytes } from 'crypto'
import { ERoles } from 'src/constants/roles.const'

export function areValidRoles(userRoles: number[]): boolean {
  const validIds = Object.values(ERoles)
  return userRoles.every((roleId) => validIds.includes(roleId))
}

export function generateInviteCode(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = randomBytes(32).toString('base64url')
  const inviteCode = (timestamp + randomPart).slice(0, 45)
  return inviteCode
}
