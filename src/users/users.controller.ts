import { Body, Controller, Post } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dtos/create-user.dto'
import { Roles } from './decorators/roles.decorator'
import { ERoles } from 'src/constants/roles.const'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(ERoles.INTERV)
  @Post()
  async createuser(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.createUser(createUserDto)
  }
}
