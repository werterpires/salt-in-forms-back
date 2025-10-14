import { Module } from '@nestjs/common'
import { SFormsService } from './s-forms.service'
import { SFormsController } from './s-forms.controller'
import { SFormsRepo } from './s-forms.repo'
import { QuestionsRepo } from '../questions/questions.repo'

const services = [SFormsService, SFormsRepo, QuestionsRepo]

@Module({
  controllers: [SFormsController],
  providers: services
})
export class SFormsModule {}
