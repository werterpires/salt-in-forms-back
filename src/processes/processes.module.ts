import { Module } from '@nestjs/common'
import { ProcessesService } from './processes.service'
import { ProcessesController } from './processes.controller'
import { ProcessesRepo } from './processes.repo'
import { ProcessesScoreCronService } from './processes-score-cron.service'

const services = [ProcessesService, ProcessesRepo, ProcessesScoreCronService]

@Module({
  controllers: [ProcessesController],
  providers: services
})
export class ProcessesModule {}
