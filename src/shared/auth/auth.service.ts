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
  LoginResponse,
  UserPayload,
  UserToken,
  UserToLogon,
  ValidateUser
} from './types'
import { JwtService } from '@nestjs/jwt'
import { LogonDto } from './dtos/logon.dto'
import { EncryptionService } from '../utils-module/encryption/encryption.service'
import { SendPulseEmailService } from '../utils-module/email-sender/sendpulse-email.service'
import { TwoFactorCacheService } from '../utils-module/two-factor-cache/two-factor-cache.service'
import { getTwoFactorCodeEmailTemplate } from './email-templates/two-factor-code.template'
import { getPasswordResetCodeEmailTemplate } from './email-templates/password-reset-code.template'
import { getPasswordResetSuccessEmailTemplate } from './email-templates/password-reset-success.template'
import { getPasswordResetAdminNotificationEmailTemplate } from './email-templates/password-reset-admin-notification.template'
import { areArraysEqual } from '../utils'

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepo,
    private readonly jwtService: JwtService,
    private readonly encryptionService: EncryptionService,
    private readonly twoFactorCache: TwoFactorCacheService,
    private readonly emailService: SendPulseEmailService
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

      // Gerar código 2FA e enviar email
      const code = this.twoFactorCache.set(email, user.userId)
      const emailHtml = getTwoFactorCodeEmailTemplate(user.userName, code)

      await this.emailService.sendEmail(email, user.userName, emailHtml)

      return {
        ...user,
        userPassword: ''
      }
    }
    throw new Error(CustomErrors.UNAUTHORIZED_EXCEPTION)
  }

  login(user: ValidateUser): LoginResponse {
    // Retornar que 2FA é necessário (código já foi enviado no validateUser)
    return {
      requires2FA: true,
      userEmail: user.userEmail
    }
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

    return user
  }

  async verify2FA(
    email: string,
    code: string,
    termsIds: number[]
  ): Promise<UserToken> {
    // Validar código 2FA
    const userId = this.twoFactorCache.validate(email, code)

    if (!userId) {
      throw new UnauthorizedException(CustomErrors.INVALID_2FA_CODE)
    }

    // Buscar dados completos do usuário
    const user = await this.authRepo.findUserByEmailForLogin(email)

    if (!user || user.userId !== userId) {
      throw new UnauthorizedException(CustomErrors.UNAUTHORIZED_EXCEPTION)
    }

    // Verificar termos pendentes
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

    // Descriptografar nome
    const userName = this.encryptionService.decrypt(user.userName)

    // Gerar JWT
    const payload: UserPayload = {
      sub: user.userId,
      userEmail: user.userEmail,
      userName,
      userActive: user.userActive,
      usersRoles: user.userRoles
    }
    const jwtToken = this.jwtService.sign(payload)
    return { accessToken: jwtToken }
  }

  async resend2FA(email: string): Promise<void> {
    // Verificar se há código pendente
    if (!this.twoFactorCache.has(email)) {
      throw new UnauthorizedException(CustomErrors.NO_2FA_CODE_PENDING)
    }

    // Buscar dados do usuário
    const user = await this.authRepo.findUserByEmailForLogin(email)

    if (!user) {
      throw new NotFoundException(CustomErrors.UNAUTHORIZED_EXCEPTION)
    }

    // Gerar novo código e enviar email
    const userName = this.encryptionService.decrypt(user.userName)
    const code = this.twoFactorCache.set(email, user.userId)
    const emailHtml = getTwoFactorCodeEmailTemplate(userName, code)

    await this.emailService.sendEmail(email, userName, emailHtml)
  }

  async forgotPassword(email: string): Promise<void> {
    // Buscar usuário - sempre retorna mesma mensagem para não vazar info
    const user = await this.authRepo.findUserByEmailForLogin(email)

    if (!user) {
      // Retorna silenciosamente sem erro para não vazar se email existe
      return
    }

    // Gerar código 2FA e enviar email
    const userName = this.encryptionService.decrypt(user.userName)
    const code = this.twoFactorCache.set(email, user.userId)
    const emailHtml = getPasswordResetCodeEmailTemplate(userName, code)

    await this.emailService.sendEmail(email, userName, emailHtml)
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<void> {
    // Validar código 2FA
    const userId = this.twoFactorCache.validate(email, code)

    if (!userId) {
      throw new UnauthorizedException(CustomErrors.INVALID_2FA_CODE)
    }

    // Buscar dados do usuário
    const user = await this.authRepo.findUserByEmailForLogin(email)

    if (!user || user.userId !== userId) {
      throw new UnauthorizedException(CustomErrors.UNAUTHORIZED_EXCEPTION)
    }

    // Hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Atualizar senha e desativar conta
    await this.authRepo.updatePasswordAndDeactivateUser(userId, passwordHash)

    // Preparar timestamp
    const timestamp = new Date().toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium'
    })

    // Enviar email de notificação para o usuário
    const userName = this.encryptionService.decrypt(user.userName)
    const userEmailHtml = getPasswordResetSuccessEmailTemplate(
      userName,
      timestamp
    )
    await this.emailService.sendEmail(email, userName, userEmailHtml)

    // Enviar notificação para todos os admins ativos
    const admins = await this.authRepo.findActiveAdminEmails()

    for (const admin of admins) {
      const adminName = this.encryptionService.decrypt(admin.userName)
      const adminEmailHtml = getPasswordResetAdminNotificationEmailTemplate(
        adminName,
        email,
        timestamp
      )
      await this.emailService.sendEmail(
        admin.userEmail,
        adminName,
        adminEmailHtml
      )
    }
  }
}
