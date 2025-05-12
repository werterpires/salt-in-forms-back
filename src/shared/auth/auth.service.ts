import {
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { AuthRepo } from './auth.repo'
import * as bcrypt from 'bcrypt'
import { CustomErrors } from '../custom-error-handler/erros.enum'
import {
  Logon,
  UserPayload,
  UserToken,
  UserToLogon,
  ValidateUser
} from './types'
import { JwtService } from '@nestjs/jwt'
import { LogonDto } from './dtos/logon.dto'
import { EncryptionService } from '../utils-module/encryption/encryption.service'
import { areArraysEqual } from '../utils'

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepo,
    private readonly jwtService: JwtService,
    private readonly encryptionService: EncryptionService
  ) {}

  async logon(invitationCode: string, logonDto: LogonDto) {
    const user: UserToLogon | undefined =
      await this.authRepo.findUserToLogonByInvitationCode(invitationCode)

    if (!user) {
      throw new NotFoundException(
        CustomErrors.USER_NOT_FOUND_BY_INVITATION_CODE
      )
    }

    if (this.isInviteCodeExpired(invitationCode)) {
      throw new GoneException(CustomErrors.INVITE_CODE_EXPIRED)
    }

    const logonData: Logon = {
      cpfHash: this.encryptionService.encrypt(logonDto.userCpf),
      passwordHash: await bcrypt.hash(logonDto.userPassword, 10),
      userId: user.userId,
      userNameHash: this.encryptionService.encrypt(logonDto.userName),
      signedTerms: logonDto.signedTerms
    }

    await this.authRepo.updateUserToLogon(logonData)
  }

  isInviteCodeExpired(inviteCode: string): boolean {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

    const timestampPart = inviteCode.slice(0, 8)
    const timestamp = parseInt(timestampPart, 36)

    return Date.now() - timestamp > TWENTY_FOUR_HOURS
  }

  async validateUser(email: string, password: string): Promise<ValidateUser> {
    const user: ValidateUser | undefined =
      await this.authRepo.findUserByEmailForLogin(email)

    if (user && user.userId > 0) {
      const isPasswordValid = await bcrypt.compare(password, user.userPassword)

      if (!isPasswordValid) {
        throw new UnauthorizedException(CustomErrors.UNAUTHORIZED_EXCEPTION)
      }

      if (!user.userActive) {
        throw new ForbiddenException(CustomErrors.INACTIVE_USER)
      }

      user.userName = this.encryptionService.decrypt(user.userName)

      return {
        ...user,
        userPassword: ''
      }
    }
    throw new Error(CustomErrors.UNAUTHORIZED_EXCEPTION)
  }

  async login(user: ValidateUser, termsIds: number[]): Promise<UserToken> {
    const notSignedPolicies = await this.authRepo.findActiveTermsNotSigned(
      user.userRoles,
      user.userId
    )

    const notSignedPoliciesIds = notSignedPolicies.map(
      (policy) => policy.termId
    )

    if (notSignedPoliciesIds.length > 0) {
      if (!areArraysEqual(notSignedPoliciesIds, termsIds)) {
        throw new ForbiddenException(CustomErrors.TERMS_NOT_SIGNED)
      }

      await this.authRepo.signTerms(user.userId, termsIds)
    }

    const payload: UserPayload = {
      sub: user.userId,
      userEmail: user.userEmail,
      userName: user.userName,
      userActive: user.userActive,
      usersRoles: user.userRoles
    }
    const jwtToken = this.jwtService.sign(payload)
    return { accessToken: jwtToken }
  }

  async getPolicies(user: ValidateUser) {
    const activeTermsNotSigned = await this.authRepo.findActiveTermsNotSigned(
      user.userRoles,
      user.userId
    )
    return activeTermsNotSigned
  }

  async getNewUserToLogon(invitationCode: string): Promise<UserToLogon> {
    const user: UserToLogon | undefined =
      await this.authRepo.findUserToLogonByInvitationCode(invitationCode)

    if (!user) {
      throw new NotFoundException(
        CustomErrors.USER_NOT_FOUND_BY_INVITATION_CODE
      )
    }

    if (this.isInviteCodeExpired(invitationCode)) {
      throw new GoneException(CustomErrors.INVITE_CODE_EXPIRED)
    }

    console.log('user', user)

    return user
  }
}
