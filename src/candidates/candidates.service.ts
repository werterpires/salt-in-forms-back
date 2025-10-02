import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CandidatesRepo } from './candidates.repo'

@Injectable()
export class CandidatesService {
  constructor(private readonly candidatesRepo: CandidatesRepo) {}

  @Cron('29 10 * * *')
  async handleProcessInSubscriptionCron() {
    const processes = await this.candidatesRepo.findProcessInSubscription()
    console.log('Processos em período de inscrição:', processes)
  }
}
