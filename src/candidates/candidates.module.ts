import { Module } from '@nestjs/common'
import { CandidatesService } from './candidates.service'
import { CandidatesController } from './candidates.controller'
import { CandidatesRepo } from './candidates.repo'

const services = [CandidatesService, CandidatesRepo]

@Module({
  controllers: [CandidatesController],
  providers: services
})
export class CandidatesModule {}
