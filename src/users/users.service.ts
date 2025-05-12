import { Injectable, UnauthorizedException } from '@nestjs/common'
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

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepo,
    private readonly encryptionService: EncryptionService
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
    return user
  }

  async findAllUsers(orderBy: Paginator, filters?: UserFilter) {
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
    const realUpdatedUser = this.usersRepo.findUserById(updateUserData.userId)
    if ((await realUpdatedUser).userId != userFromJwt.userId) {
      throw new UnauthorizedException('#Não é possivel atualizar outro usuario')
    }

    await this.usersRepo.updateOwnUser(updateUserData)
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
}
