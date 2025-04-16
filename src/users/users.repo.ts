import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { CreateUser, User } from './types'
import * as db from '../constants/db-schema.enum'

@Injectable()
export class UsersRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async createUser(createUserData: CreateUser): Promise<number> {
    const { userEmail, userName, userInviteCode } = createUserData
    const [userId] = await this.knex(db.Tables.USERS).insert({
      [db.Users.USER_NAME]: userName,
      [db.Users.USER_EMAIL]: userEmail,
      [db.Users.USER_ACTIVE]: true,
      [db.Users.USER_INVITE_CODE]: userInviteCode
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
