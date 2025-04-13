import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { Tables, Users } from 'src/constants/db-schema.enum'
import { ValidateUser as ValidateUser } from './types'

@Injectable()
export class AuthRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async findUserByEmailForLogin(
    email: string
  ): Promise<ValidateUser | undefined> {
    const user = (await this.knex<ValidateUser>(Tables.USERS)
      .select(
        Users.USER_PASSWORD,
        Users.USER_ID,
        Users.USER_EMAIL,
        Users.USER_ACTIVE,
        Users.USER_NAME
      )
      .where(Users.USER_EMAIL, email)
      .first()) as ValidateUser | undefined

    return user
  }
}
