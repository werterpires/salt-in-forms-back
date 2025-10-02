import { Module } from '@nestjs/common'
import { CandidatesService } from './candidates.service'
import { CandidatesController } from './candidates.controller'
import { CandidatesRepo } from './candidates.repo'
import { UtilsModuleModule } from '../shared/utils-module/utils-module.module'

const services = [CandidatesService, CandidatesRepo]

@Module({
  imports: [UtilsModuleModule],
  controllers: [CandidatesController],
  providers: services
})
export class CandidatesModule {}
