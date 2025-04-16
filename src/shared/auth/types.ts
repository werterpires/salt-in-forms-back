export interface ValidateUser {
  userPassword: string
  userId: number
  userEmail: string
  userActive: boolean
  userName: string
}

export interface UserToken {
  access_token: string
}

export interface UserPayload {
  userEmail: string
  sub: number
  userName: string
  userActive: boolean
  iat?: number
  exp?: number
}

export interface AuthRequest extends Request {
  user: ValidateUser
}

export interface Logon {
  userId: number
  userNameHash: string
  cpfHash: string
  passwordHash: string
  userEmail: string
}
