import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import {
  Tables,
  Users,
  UsersRoles,
  TermsSignatures,
  Terms
} from 'src/constants/db-schema.enum'
import { Logon, ValidateUser as ValidateUser } from './types'
import { Term } from 'src/terms/types'

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
    const user = await this.knex<ValidateUser>(Tables.USERS)
      .select(
        Users.USER_PASSWORD,
        Users.USER_ID,
        Users.USER_EMAIL,
        Users.USER_ACTIVE,
        Users.USER_NAME
      )
      .where(Users.USER_EMAIL, email)
      .first()

    const userRoles = await this.knex<ValidateUser>(Tables.USERS_ROLES)
      .select(UsersRoles.ROLE_ID)
      .where(UsersRoles.USER_ID, user.userId)

    user.userRoles = userRoles.map((role) => role.roleId)

    return user as ValidateUser
  }

  async findNoSignedTermsByUserAndRoleId(
    userId: number,
    rolesId: number[]
  ): Promise<Term[]> {
    const termsConsult = await this.knex<boolean>(Tables.TERMS)
      .innerJoin(
        Tables.TERMS_SIGNATURES,
        TermsSignatures.TERM_ID,
        Terms.TERM_ID
      )
      .select(
        Terms.ROLE_ID,
        Terms.TERM_ID,
        Terms.BEGIN_DATE,
        Terms.END_DATE,
        Terms.TERM_TYPE_ID,
        Terms.TERM_TEXT
      )
      .where(Terms.ROLE_ID, 'in', rolesId)
      .andWhere(Terms.END_DATE, '>', new Date())
      .andWhereNot(TermsSignatures.USER_ID, 'in', userId)

    const terms: Term[] = termsConsult.map((term) => ({
      roleId: term.roleId,
      termId: term.termId,
      beginDate: term.beginDate,
      endDate: term.endDate,
      termTypeId: term.termTypeId,
      termText: term.termText
    }))

    return terms
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
