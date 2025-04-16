import { Injectable } from '@nestjs/common'
import { UsersRepo } from './users.repo'
import { CreateUserDto } from './dtos/create-user.dto'
import { CreateUser, User } from './types'
import { randomBytes } from 'crypto'

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepo) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const createUserData: CreateUser = {
      ...createUserDto,
      userInviteCode: this.generateInviteCode()
    }

    const userId = await this.usersRepo.createUser(createUserData)
    const user = await this.usersRepo.findUserById(userId)
    return user
  }

  generateInviteCode(): string {
    const timestamp = Date.now().toString(36)
    const randomPart = randomBytes(32).toString('base64url')
    const inviteCode = (timestamp + randomPart).slice(0, 45)
    return inviteCode
  }
}
