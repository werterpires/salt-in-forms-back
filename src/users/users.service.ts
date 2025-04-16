import { Injectable } from '@nestjs/common'
import { UsersRepo } from './users.repo'
import { CreateUserDto } from './dtos/create-user.dto'
import { User } from './types'

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepo) {}

  async createUser(createUserData: CreateUserDto): Promise<User> {
    const userId = await this.usersRepo.createUser(createUserData)
    const user = await this.usersRepo.findUserById(userId)
    return user
  }
}
