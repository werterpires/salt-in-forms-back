import { Module } from '@nestjs/common'
import { CandidatesService } from './candidates.service'
import { CandidatesController } from './candidates.controller'
import { CandidatesRepo } from './candidates.repo'
import { UtilsModuleModule } from '../shared/utils-module/utils-module.module'
import { FormsCandidatesModule } from '../forms-candidates/forms-candidates.module'
import { ExternalOrderValidationService } from './external-order-validation.service'
import { PendingCandidatesRepo } from './pending-candidates.repo'
import { PendingCandidatesService } from './pending-candidates.service'

const services = [
  CandidatesService,
  CandidatesRepo,
  ExternalOrderValidationService,
  PendingCandidatesRepo,
  PendingCandidatesService
]

@Module({
  imports: [UtilsModuleModule, FormsCandidatesModule],
  controllers: [CandidatesController],
  providers: services
})
export class CandidatesModule {}
