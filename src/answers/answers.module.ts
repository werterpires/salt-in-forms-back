

import { Module } from '@nestjs/common'
import { AnswersService } from './answers.service'
import { AnswersController } from './answers.controller'
import { AnswersRepo } from './answers.repo'
import { FormsCandidatesModule } from '../forms-candidates/forms-candidates.module'

@Module({
  imports: [FormsCandidatesModule],
  controllers: [AnswersController],
  providers: [AnswersService, AnswersRepo]
})
export class AnswersModule {}
