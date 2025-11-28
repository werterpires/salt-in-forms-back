import { Module, forwardRef } from '@nestjs/common'
import { AnswersService } from './answers.service'
import { AnswersController } from './answers.controller'
import { AnswersRepo } from './answers.repo'
import { FormsCandidatesModule } from '../forms-candidates/forms-candidates.module'
import { FormsCandidatesRepo } from '../forms-candidates/forms-candidates.repo'
import { QuestionsModule } from '../questions/questions.module'
import { FormSectionsModule } from '../form-sections/form-sections.module'
import { UtilsModuleModule } from '../shared/utils-module/utils-module.module'

@Module({
  imports: [
    forwardRef(() => FormsCandidatesModule),
    QuestionsModule,
    FormSectionsModule,
    UtilsModuleModule
  ],
  controllers: [AnswersController],
  providers: [AnswersService, AnswersRepo, FormsCandidatesRepo],
  exports: [AnswersRepo]
})
export class AnswersModule {}
