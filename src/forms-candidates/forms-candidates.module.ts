import { Module, forwardRef } from '@nestjs/common'
import { FormsCandidatesController } from './forms-candidates.controller'
import { FormsCandidatesService } from './forms-candidates.service'
import { FormsCandidatesRepo } from './forms-candidates.repo'
import { FormsCandidatesCronService } from './forms-candidates.cron.service'
import { UtilsModuleModule } from '../shared/utils-module/utils-module.module'
import { QuestionsModule } from 'src/questions/questions.module'
import { AnswersModule } from 'src/answers/answers.module'
import { MinisterialsModule } from 'src/ministerials/ministerials.module'

@Module({
  imports: [
    UtilsModuleModule,
    QuestionsModule,
    forwardRef(() => AnswersModule),
    MinisterialsModule
  ],
  controllers: [FormsCandidatesController],
  providers: [
    FormsCandidatesService,
    FormsCandidatesRepo,
    FormsCandidatesCronService
  ],
  exports: [FormsCandidatesService]
})
export class FormsCandidatesModule {}
