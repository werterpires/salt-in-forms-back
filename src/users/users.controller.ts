import { Body, Controller, Post } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dtos/create-user.dto'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createuser(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.createUser(createUserDto)
  }
}
