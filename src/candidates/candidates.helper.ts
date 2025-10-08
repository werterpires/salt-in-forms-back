
import { randomBytes } from 'crypto'

export function createAccessCode(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = randomBytes(32).toString('base64url')
  const inviteCode = (timestamp + randomPart).slice(0, 45)
  return inviteCode
}
