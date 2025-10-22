import { Module } from '@nestjs/common'
import { AnswersService } from './answers.service'
import { AnswersController } from './answers.controller'
import { AnswersRepo } from './answers.repo'
import { FormsCandidatesModule } from '../forms-candidates/forms-candidates.module'
import { QuestionsRepo } from '../questions/questions.repo'

@Module({
  imports: [FormsCandidatesModule],
  controllers: [AnswersController],
  providers: [AnswersService, AnswersRepo, QuestionsRepo],
  exports: [AnswersService]
})
export class AnswersModule {}