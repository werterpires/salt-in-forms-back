import { Injectable } from '@nestjs/common'
import { UsersRepo } from './users.repo'
import { CreateUserDto } from './dtos/create-user.dto'
import { CreateUser, User } from './types'
import { randomBytes } from 'crypto'
import { ERoles } from 'src/constants/roles.const'

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepo) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const unexistingRoles = createUserDto.userRoles.length == 0
    if (unexistingRoles || !this.areValidRoles(createUserDto.userRoles)) {
      throw new Error('#Um ou mais papéis de usuário são inválidos.')
    }

    const createUserData: CreateUser = {
      ...createUserDto,
      userInviteCode: this.generateInviteCode()
    }

    const userId = await this.usersRepo.createUser(createUserData)
    const user = await this.usersRepo.findUserById(userId)
    return user
  }

  areValidRoles(userRoles: number[]): boolean {
    const validIds = Object.values(ERoles)
    return userRoles.every((roleId) => validIds.includes(roleId))
  }

  generateInviteCode(): string {
    const timestamp = Date.now().toString(36)
    const randomPart = randomBytes(32).toString('base64url')
    const inviteCode = (timestamp + randomPart).slice(0, 45)
    return inviteCode
  }
}
