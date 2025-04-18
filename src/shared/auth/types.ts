export interface ValidateUser {
  userPassword: string
  userId: number
  userEmail: string
  userActive: boolean
  userName: string
  userRoles: number[]
}

export interface UserToken {
  access_token: string
}

export interface UserPayload {
  userEmail: string
  sub: number
  userName: string
  userActive: boolean
  usersRoles: number[]
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
