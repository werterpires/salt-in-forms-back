import { Module } from '@nestjs/common'
import { QuestionsAreasService } from './questions-areas.service'
import { QuestionsAreasController } from './questions-areas.controller'
import { QuestionsAreasRepo } from './questions-areas.repo'

const services = [QuestionsAreasService, QuestionsAreasRepo]

@Module({
  controllers: [QuestionsAreasController],
  providers: services
})
export class QuestionsAreasModule {}
