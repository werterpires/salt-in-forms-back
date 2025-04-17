import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { Tables, Users } from 'src/constants/db-schema.enum'
import { Logon, ValidateUser as ValidateUser } from './types'

@Injectable()
export class AuthRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async updateUserToLogon(userLogon: Logon) {
    const { userId, passwordHash, userNameHash, userEmail, cpfHash } = userLogon
    await this.knex(Tables.USERS)
      .update({
        [Users.USER_PASSWORD]: passwordHash,
        [Users.USER_NAME]: userNameHash,
        [Users.USER_EMAIL]: userEmail,
        [Users.USER_CPF]: cpfHash
      })
      .where(Users.USER_ID, userId)
  }

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

  async findUserByInvitationCodeForLogon(
    invitationCode: string
  ): Promise<ValidateUser | undefined> {
    const user = (await this.knex<ValidateUser>(Tables.USERS)
      .select(Users.USER_ID)
      .where(Users.USER_INVITE_CODE, invitationCode)
      .first()) as ValidateUser | undefined

    return user
  }
}
