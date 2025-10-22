import { Module } from '@nestjs/common'
import { SFormsService } from './s-forms.service'
import { SFormsController } from './s-forms.controller'
import { SFormsRepo } from './s-forms.repo'
import { QuestionsModule } from '../questions/questions.module'

const services = [SFormsService, SFormsRepo]

@Module({
  imports: [QuestionsModule],
  controllers: [SFormsController],
  providers: services
})
export class SFormsModule {}
