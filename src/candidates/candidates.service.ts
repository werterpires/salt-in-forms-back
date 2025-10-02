import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CreateCandidateDto } from './dto/create-candidate.dto'
import { UpdateCandidateDto } from './dto/update-candidate.dto'
import { CandidatesRepo } from './candidates.repo'
import { ExternalApiService } from '../shared/utils-module/external-api/external-api.service'

@Injectable()
export class CandidatesService {
  constructor(
    private readonly candidatesRepo: CandidatesRepo,
    private readonly externalApiService: ExternalApiService
  ) {}

  @Cron('25 10 * * *')
  async handleProcessInSubscriptionCron() {
    const processes = await this.candidatesRepo.findProcessInSubscription()
    console.log('Processos em período de inscrição:', processes)

    const baseUrl = process.env.PROCESS_CANDIDATES_API

    if (!baseUrl) {
      console.error('PROCESS_CANDIDATES_API não está definido no .env')
      return
    }

    for (const process of processes) {
      try {
        const apiUrl = `${baseUrl}${process.processTotvsId}`
        console.log(`Buscando candidatos para processo ${process.processTitle} (${process.processTotvsId})`)

        const response = await this.externalApiService.get(apiUrl)

        console.log(`Resposta da API para processo ${process.processTotvsId}:`, response.data)
      } catch (error) {
        console.error(`Erro ao buscar candidatos do processo ${process.processTotvsId}:`, error.message)
      }
    }
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