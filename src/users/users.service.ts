import {
  BadRequestException,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common'
import { UserFromJwt } from 'src/shared/auth/types'
import { FindAllResponse, Paginator } from 'src/shared/types/types'
import { CreateUserDto } from './dtos/create-user.dto'
import { UpdateOwnUserDto } from './dtos/update-own-user.dto'
import { UpdateUserDto } from './dtos/update-user.dto'
import { CreateUser, User, UserFilter } from './types'
import { areValidRoles, generateInviteCode } from './users.helper'
import { UsersRepo } from './users.repo'
import { UpdatePasswordDto } from './dtos/update-pass.dto'
import * as bcrypt from 'bcrypt'
import { EncryptionService } from 'src/shared/utils-module/encryption/encryption.service'
import * as db from 'src/constants/db-schema.enum'
import { SendPulseEmailService } from 'src/shared/utils-module/email-sender/sendpulse-email.service'
import { RoleDetails } from 'src/constants/roles.const'
import { EmailTemplateBuilder } from 'src/shared/utils-module/email-sender/email-template.builder'

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepo,
    private readonly encryptionService: EncryptionService,
    private readonly emailService: SendPulseEmailService
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const unexistingRoles = createUserDto.userRoles.length == 0
    if (unexistingRoles || !areValidRoles(createUserDto.userRoles)) {
      throw new Error('#Um ou mais papéis de usuário são inválidos.')
    }

    const createUserData: CreateUser = {
      ...createUserDto,
      userInviteCode: generateInviteCode()
    }

    const userId = await this.usersRepo.createUser(createUserData)
    const user = await this.usersRepo.findUserById(userId)

    // Envia e-mail de convite
    await this.sendInviteEmail(
      createUserDto.userEmail,
      createUserDto.userName,
      createUserDto.userRoles,
      createUserData.userInviteCode
    )
    return user
  }

  async reinviteUser(userId: number) {
    const userDoneId = await this.usersRepo.findUserByIdAndDoneInvite(userId)
    if (userDoneId) {
      throw new BadRequestException('#O usuário já se cadastrou.')
    }
    const inviteCode = generateInviteCode()
    await this.usersRepo.reinviteUser(userId, inviteCode)

    // Busca dados do usuário e envia novo e-mail de convite
    const user = await this.usersRepo.findUserById(userId)
    const userNameDecrypted = this.encryptionService.decrypt(user.userName)
    await this.sendInviteEmail(
      user.userEmail,
      userNameDecrypted,
      user.userRoles,
      inviteCode
    )
  }

  async findAllUsers(
    orderBy: Paginator<typeof db.Users>,
    filters?: UserFilter
  ) {
    const users: User[] = await this.usersRepo.findAllUsers(orderBy, filters)
    for (const user of users) {
      user.userName = this.encryptionService.decrypt(user.userName)

      const roles = await this.usersRepo.findRolesByUserId(user.userId)

      user.userRoles = roles
    }
    const usersQuantity = await this.usersRepo.findUsersQuantity(filters)

    const usersResponse: FindAllResponse<User> = {
      data: users,
      pagesQuantity: usersQuantity
    }

    return usersResponse
  }

  async updateUser(updateUserData: UpdateUserDto) {
    await this.usersRepo.updateUser(updateUserData)
  }

  async updateOwnUser(
    updateUserData: UpdateOwnUserDto,
    userFromJwt: UserFromJwt
  ) {
    await this.usersRepo.updateOwnUser(updateUserData, userFromJwt.userId)
  }

  async findOwnUser(userId: number) {
    const ownUser = await this.usersRepo.findUserById(userId)
    ownUser.userName = this.encryptionService.decrypt(ownUser.userName)
    return ownUser
  }

  async updatePassword(userId: number, updatePasswordDto: UpdatePasswordDto) {
    const currentPassHash = await this.usersRepo.findPasswordByUserId(userId)
    const isValidPassword = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      currentPassHash
    )

    if (!isValidPassword) {
      throw new Error('#A senha antiga fornecida é inválida.')
    }

    const passwordHash = await bcrypt.hash(updatePasswordDto.newPassword, 10)

    await this.usersRepo.updatePassword(userId, passwordHash)
  }

  private getFrontendAdmUrl(): string {
    const url = process.env.FRONTEND_ADM_URL
    if (!url) {
      throw new InternalServerErrorException(
        'FRONTEND_ADM_URL não está definido no .env'
      )
    }
    return url
  }

  private buildInviteLink(inviteCode: string): string {
    const base = this.getFrontendAdmUrl()
    const baseNormalized = base.endsWith('/') ? base.slice(0, -1) : base
    return `${baseNormalized}/#/logon/${inviteCode}`
  }

  private formatRolesPtBr(roleIds: number[]): string {
    const names = roleIds
      .map((id) => RoleDetails[id as keyof typeof RoleDetails]?.roleName)
      .filter(Boolean)
    if (names.length === 0) return ''
    if (names.length === 1) return names[0]
    if (names.length === 2) return `${names[0]} e ${names[1]}`
    return names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1]
  }

  private async sendInviteEmail(
    recipientEmail: string,
    recipientName: string,
    roleIds: number[],
    inviteCode: string
  ) {
    const link = this.buildInviteLink(inviteCode)
    const rolesText = this.formatRolesPtBr(roleIds)

    const contentBeforeButton = [
      `Você foi convidado para fazer parte do <strong>SaltInForms</strong>${rolesText ? ` como <strong>${rolesText}</strong>` : ''}.`,
      'Para aceitar o convite e configurar seu acesso, clique no botão abaixo:'
    ]

    const body = EmailTemplateBuilder.build({
      recipientName,
      contentBeforeButton,
      button: {
        text: 'Acessar Convite',
        url: link
      }
    })

    await this.emailService.sendEmail(recipientEmail, recipientName, body)
  }
}
