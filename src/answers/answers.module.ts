import { Module } from '@nestjs/common'
import { AnswersService } from './answers.service'
import { AnswersController } from './answers.controller'
import { AnswersRepo } from './answers.repo'
import { FormsCandidatesModule } from '../forms-candidates/forms-candidates.module'
import { QuestionsModule } from '../questions/questions.module'

@Module({
  imports: [FormsCandidatesModule, QuestionsModule],
  controllers: [AnswersController],
  providers: [AnswersService, AnswersRepo],
  exports: [AnswersService]
})
export class AnswersModule {}