export interface CreateUser {
  userEmail: string
  userName: string
  userInviteCode: string
  userRoles: number[]
}

export interface User {
  userId: number
  userEmail: string
  userActive: boolean
  userName: string
}
