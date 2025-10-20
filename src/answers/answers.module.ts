
import { Module } from '@nestjs/common'
import { AnswersService } from './answers.service'
import { AnswersController } from './answers.controller'
import { AnswersRepo } from './answers.repo'
import { CandidatesRepo } from '../candidates/candidates.repo'
import { UtilsModuleModule } from '../shared/utils-module/utils-module.module'

@Module({
  imports: [UtilsModuleModule],
  controllers: [AnswersController],
  providers: [AnswersService, AnswersRepo, CandidatesRepo]
})
export class AnswersModule {}
