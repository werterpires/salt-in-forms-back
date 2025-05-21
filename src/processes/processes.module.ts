import { Module } from '@nestjs/common'
import { ProcessesService } from './processes.service'
import { ProcessesController } from './processes.controller'
import { ProcessesRepo } from './processes.repo'

const services = [ProcessesService, ProcessesRepo]

@Module({
  controllers: [ProcessesController],
  providers: services
})
export class ProcessesModule {}
