export interface CreateUser {
  userEmail: string
  userName: string
  userInviteCode: string
}

export interface User {
  userId: number
  userEmail: string
  userActive: boolean
  userName: string
}
