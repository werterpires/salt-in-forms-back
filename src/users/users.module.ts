import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { UsersRepo } from './users.repo'

const services = [UsersService, UsersRepo]

@Module({
  controllers: [UsersController],
  providers: services
})
export class UsersModule {}
