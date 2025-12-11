import { ERoles } from 'src/constants/roles.const'

export interface CreateUser {
  userEmail: string
  userName: string
  userInviteCode: string
  userRoles: number[]
}

export interface User {
  userId: number
  userEmail: string
  userActive: boolean | null
  userName: string
  userRoles: ERoles[]
  userInviteCode?: string
}

export interface UpdateUser extends UpdateOwnUser {
  userRoles: ERoles[]
  userActive: boolean
  userName: string
  userId: number
}

export interface UpdateOwnUser {
  userEmail: string
}

export interface UserFilter {
  userEmail?: string
  userActive?: boolean
  roleId?: number
}

export interface InterviewerBasicInfo {
  userId: number
  userName: string
}
