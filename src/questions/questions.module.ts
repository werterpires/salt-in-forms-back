
import { Module } from '@nestjs/common'
import { QuestionsService } from './questions.service'
import { QuestionsController } from './questions.controller'
import { QuestionsRepo } from './questions.repo'
import { FormSectionsRepo } from '../form-sections/form-sections.repo'

const services = [QuestionsService, QuestionsRepo, FormSectionsRepo]

@Module({
  controllers: [QuestionsController],
  providers: services
})
export class QuestionsModule {}
