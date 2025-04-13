import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { Tables, Users } from 'src/constants/db-schema.enum'
import { User } from './types'

@Injectable()
export class UsersRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async findUserByEmailForLogin(email: string): Promise<User | undefined> {
    const user = (await this.knex<User>(Tables.USERS)
      .select(
        Users.USER_PASSWORD,
        Users.USER_ID,
        Users.USER_EMAIL,
        Users.USER_ACTIVE,
        Users.USER_NAME
      )
      .where(Users.USER_EMAIL, email)
      .first()) as User | undefined

    return user
  }
}
