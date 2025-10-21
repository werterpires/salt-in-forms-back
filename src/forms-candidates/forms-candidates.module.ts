
import { Module } from '@nestjs/common'
import { FormsCandidatesService } from './forms-candidates.service'
import { FormsCandidatesRepo } from './forms-candidates.repo'
import { UtilsModuleModule } from '../shared/utils-module/utils-module.module'

@Module({
  imports: [UtilsModuleModule],
  providers: [FormsCandidatesService, FormsCandidatesRepo],
  exports: [FormsCandidatesService]
})
export class FormsCandidatesModule {}
