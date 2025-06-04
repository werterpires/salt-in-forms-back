import { Module } from '@nestjs/common'
import { MinisterialsService } from './ministerials.service'
import { MinisterialsController } from './ministerials.controller'
import { MinisterialsRepo } from './ministerials.repo'

const services = [MinisterialsService, MinisterialsRepo]
@Module({
  controllers: [MinisterialsController],
  providers: services
})
export class MinisterialsModule {}
