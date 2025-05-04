import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dtos/create-user.dto'
import { Roles } from './decorators/roles.decorator'
import { ERoles } from 'src/constants/roles.const'
import { Direction, Paginator } from 'src/shared/types/types'
import * as db from '../constants/db-schema.enum'
import { UserFilter } from './types'
import { UpdateUserDto } from './dtos/update-user.dto'
import { UpdateOwnUserDto } from './dtos/update-own-user.dto'
import { CurrentUser } from './decorators/current-user.decorator'
import { UserFromJwt } from 'src/shared/auth/types'
import { UpdatePasswordDto } from './dtos/update-pass.dto'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(ERoles.ADMIN)
  @Post()
  async createuser(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.createUser(createUserDto)
  }

  @Roles(ERoles.ADMIN)
  @Get()
  findAll(
    @Query('direction') direction: string,
    @Query('page') page: string,
    @Query('column') column: string,
    @Query('roleId') roleId: string,
    @Query('userEmail') userEmail: string,
    @Query('userActive') userActive: boolean
  ) {
    const paginator: Paginator = {
      column: Object.values(db.Users).includes(column as db.Users)
        ? column
        : db.Users.USER_NAME,
      direction: Object.values(Direction).includes(direction as Direction)
        ? (direction as Direction)
        : Direction.ASC,
      page: +page || 1
    }

    const filters: UserFilter = {
      roleId: +roleId || undefined,
      userEmail,
      userActive
    }

    return this.usersService.findAllUsers(paginator, filters)
  }

  @Roles(ERoles.ADMIN)
  @Put()
  update(@Body() UpdateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(UpdateUserDto)
  }

  @Put('own')
  updateOwn(
    @Body() UpdateOwnUserDto: UpdateOwnUserDto,
    @CurrentUser() userFromJwt: UserFromJwt
  ) {
    return this.usersService.updateOwnUser(UpdateOwnUserDto, userFromJwt)
  }

  @Put('password')
  updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @CurrentUser() userFromJwt: UserFromJwt
  ) {
    return this.usersService.updatePassword(
      userFromJwt.userId,
      updatePasswordDto
    )
  }
}
