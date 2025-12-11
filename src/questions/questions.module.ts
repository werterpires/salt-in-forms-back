
import { Module } from '@nestjs/common'
import { QuestionsService } from './questions.service'
import { QuestionsController } from './questions.controller'
import { QuestionsRepo } from './questions.repo'
import { FormSectionsRepo } from '../form-sections/form-sections.repo'
import { AnswersRepo } from '../answers/answers.repo'

const services = [
  QuestionsService,
  QuestionsRepo,
  FormSectionsRepo,
  AnswersRepo
]

@Module({
  controllers: [QuestionsController],
  providers: services,
  exports: [QuestionsRepo]
})
export class QuestionsModule {}
