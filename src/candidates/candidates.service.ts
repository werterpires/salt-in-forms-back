
import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CreateCandidateDto } from './dto/create-candidate.dto'
import { UpdateCandidateDto } from './dto/update-candidate.dto'
import { CandidatesRepo } from './candidates.repo'

@Injectable()
export class CandidatesService {
  constructor(private readonly candidatesRepo: CandidatesRepo) {}

  @Cron('25 10 * * *')
  async handleProcessInSubscriptionCron() {
    const processes = await this.candidatesRepo.findProcessInSubscription()
    console.log('Processos em período de inscrição:', processes)
  }

  create(createCandidateDto: CreateCandidateDto) {
    return 'This action adds a new candidate'
  }

  findAll() {
    return `This action returns all candidates`
  }

  findOne(id: number) {
    return `This action returns a #${id} candidate`
  }

  update(id: number, updateCandidateDto: UpdateCandidateDto) {
    return `This action updates a #${id} candidate`
  }

  remove(id: number) {
    return `This action removes a #${id} candidate`
  }
}
