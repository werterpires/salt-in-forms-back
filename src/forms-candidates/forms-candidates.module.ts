
import { Module } from '@nestjs/common'
import { FormsCandidatesService } from './forms-candidates.service'
import { CandidatesRepo } from '../candidates/candidates.repo'
import { UtilsModuleModule } from '../shared/utils-module/utils-module.module'

@Module({
  imports: [UtilsModuleModule],
  providers: [FormsCandidatesService, CandidatesRepo],
  exports: [FormsCandidatesService]
})
export class FormsCandidatesModule {}
