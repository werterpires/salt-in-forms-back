import { Module } from '@nestjs/common'
import { SFormsService } from './s-forms.service'
import { SFormsController } from './s-forms.controller'
import { SFormsRepo } from './s-forms.repo'
import { QuestionsModule } from '../questions/questions.module'
import { AnswersRepo } from '../answers/answers.repo'

const services = [SFormsService, SFormsRepo, AnswersRepo]

@Module({
  imports: [QuestionsModule],
  controllers: [SFormsController],
  providers: services
})
export class SFormsModule {}
