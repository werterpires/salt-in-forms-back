import { Module } from '@nestjs/common'
import { RatesService } from './rates.service'
import { RatesController } from './rates.controller'
import { RatesRepo } from './rates.repo'
import { CandidatesRepo } from '../candidates/candidates.repo'

@Module({
  imports: [],
  controllers: [RatesController],
  providers: [RatesService, RatesRepo, CandidatesRepo]
})
export class RatesModule {}
