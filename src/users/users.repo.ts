import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { CreateUser, User } from './types'
import * as db from '../constants/db-schema.enum'

@Injectable()
export class UsersRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

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
    const user = await this.knex<User>(db.Tables.USERS)
      .select(
        db.Users.USER_NAME,
        db.Users.USER_EMAIL,
        db.Users.USER_ID,
        db.Users.USER_ACTIVE
      )
      .where(db.Users.USER_ID, userId)
      .first()

    return user
  }
}
