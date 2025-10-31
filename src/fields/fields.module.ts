import { Module } from '@nestjs/common'
import { FieldsService } from './fields.service'
import { FieldsController } from './fields.controller'
import { FieldsRepo } from './fields.repo'

const services = [FieldsService, FieldsRepo]

@Module({
  controllers: [FieldsController],
  providers: services
})
export class FieldsModule {}
