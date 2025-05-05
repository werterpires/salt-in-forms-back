import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import {
  CreateUser,
  UpdateOwnUser,
  UpdateUser,
  User,
  UserFilter
} from './types'
import * as db from '../constants/db-schema.enum'
import { Paginator } from 'src/shared/types/types'

@Injectable()
export class UsersRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}
  elementsPerPage = 20

  async createUser(createUserData: CreateUser): Promise<number> {
    const { userEmail, userName, userInviteCode, userRoles } = createUserData
    const userId = await this.knex.transaction(async (trx) => {
      const [userIdConsult] = await trx(db.Tables.USERS).insert({
        [db.Users.USER_NAME]: userName,
        [db.Users.USER_EMAIL]: userEmail,
        [db.Users.USER_ACTIVE]: true,
        [db.Users.USER_INVITE_CODE]: userInviteCode
      })

      for (const id of userRoles) {
        await trx(db.Tables.USERS_ROLES).insert({
          [db.UsersRoles.USER_ID]: userIdConsult,
          [db.UsersRoles.ROLE_ID]: id,
          [db.UsersRoles.USER_ROLE_ACTIVE]: true
        })
      }

      return userIdConsult
    })

    return userId
  }

  async findUserById(userId: number) {
    const userConsult = await this.knex(db.Tables.USERS)
      .select(
        db.Users.USER_NAME,
        db.Users.USER_EMAIL,
        db.Users.USER_ID,
        db.Users.USER_ACTIVE
      )
      .where(db.Users.USER_ID, userId)
      .first()

    const userRoles = await this.knex(db.Tables.USERS_ROLES)
      .select(db.UsersRoles.ROLE_ID)
      .where(db.UsersRoles.USER_ID, userId)

    const user: User = {
      ...userConsult,
      userRoles: userRoles.map((role) => role.roleId)
    }

    return user
  }

  async findPasswordByUserId(userId: number) {
    const userPassword = await this.knex(db.Tables.USERS)
      .select(db.Users.USER_PASSWORD)
      .where(db.Users.USER_ID, userId)
      .first()

    return userPassword.userPassword
  }

  async updateUser(updateUserData: UpdateUser) {
    const { userActive, userEmail, userId, userName, userRoles } =
      updateUserData

    await this.knex.transaction(async (trx) => {
      await trx(db.Tables.USERS)
        .where(db.Users.USER_ID, userId)
        .update({
          [db.Users.USER_NAME]: userName,
          [db.Users.USER_EMAIL]: userEmail,
          [db.Users.USER_ACTIVE]: userActive
        })

      const currentRoles = await trx(db.Tables.USERS_ROLES)
        .select(db.UsersRoles.ROLE_ID, db.UsersRoles.USER_ROLE_ACTIVE)
        .where(db.UsersRoles.USER_ID, userId)

      const currentRoleIds = currentRoles.map((r) => r.roleId)

      const rolesToDelete = currentRoleIds.filter(
        (id) => !userRoles.includes(id)
      )

      const rolesToCreate = userRoles.filter(
        (id) => !currentRoleIds.includes(id)
      )

      for (const id of rolesToDelete) {
        await trx(db.Tables.USERS_ROLES)
          .delete()
          .where({
            [db.UsersRoles.USER_ID]: userId,
            [db.UsersRoles.ROLE_ID]: id
          })
      }

      for (const id of rolesToCreate) {
        await trx(db.Tables.USERS_ROLES).insert({
          [db.UsersRoles.USER_ID]: userId,
          [db.UsersRoles.ROLE_ID]: id,
          [db.UsersRoles.USER_ROLE_ACTIVE]: true
        })
      }
    })
  }

  async updateOwnUser(updateUserData: UpdateOwnUser) {
    const { userEmail, userId, userName } = updateUserData
    return await this.knex(db.Tables.USERS)
      .where(db.Users.USER_ID, userId)
      .update({
        [db.Users.USER_NAME]: userName,
        [db.Users.USER_EMAIL]: userEmail
      })
  }

  async updatePassword(userId: number, passwordHash: string) {
    return await this.knex(db.Tables.USERS)
      .where(db.Users.USER_ID, userId)
      .update({
        [db.Users.USER_PASSWORD]: passwordHash
      })
  }

  async findAllUsers(orderBy: Paginator, filters?: UserFilter) {
    const query = this.knex(db.Tables.USERS).select(
      db.Users.USER_NAME,
      db.Users.USER_EMAIL,
      db.Users.USER_ID,
      db.Users.USER_ACTIVE
    )

    if (filters) {
      if (filters.roleId) {
        query
          .rightJoin(
            db.Tables.USERS_ROLES,
            db.Users.USER_ID,
            db.UsersRoles.USER_ID
          )
          .where(db.UsersRoles.ROLE_ID, filters.roleId)
      }
      if (filters.userEmail) {
        query.where(db.Users.USER_EMAIL, 'like', `%${filters.userEmail}%`)
      }
      if (filters.userActive) {
        query.where(db.Users.USER_ACTIVE, filters.userActive)
      }
    }
    query.orderBy(orderBy.column, orderBy.direction)

    query
      .limit(this.elementsPerPage)
      .offset((orderBy.page - 1 || 0) * this.elementsPerPage)

    const results = await query
    return results
  }

  async findUsersQuantity(filters?: UserFilter) {
    const query = this.knex(db.Tables.USERS)

    if (filters) {
      if (filters.roleId) {
        query
          .rightJoin(
            db.Tables.USERS_ROLES,
            db.Users.USER_ID,
            db.UsersRoles.USER_ID
          )
          .where(db.UsersRoles.ROLE_ID, filters.roleId)
          .where(db.UsersRoles.USER_ROLE_ACTIVE, true)
      }
      if (filters.userEmail) {
        query.where(db.Users.USER_EMAIL, 'like', `%${filters.userEmail}%`)
      }
      if (filters.userActive) {
        query.where(db.Users.USER_ACTIVE, filters.userActive)
      }
    }

    query.countDistinct(db.Users.USER_ID)
    const [results] = await query

    const countKey = Object.keys(results)[0]
    const count = Number(results[countKey])
    return Math.ceil(count / this.elementsPerPage) || 0
  }

  async findRolesByUserId(userId: number) {
    const rolesConsult = await this.knex(db.Tables.USERS_ROLES)
      .select(db.UsersRoles.ROLE_ID)
      .where(db.UsersRoles.USER_ID, userId)
      .where(db.UsersRoles.USER_ROLE_ACTIVE, true)

    return rolesConsult.map((r) => r.roleId)
  }
}
