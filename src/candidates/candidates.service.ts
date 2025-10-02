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

        // Parse e criar candidatos
        const candidates = this.parseApiResponseToCandidates(response.data, process.processId)
        
        console.log(`\n=== Candidatos criados para processo ${process.processTitle} ===`)
        candidates.forEach((candidate, index) => {
          console.log(`\nCandidato ${index + 1}:`, JSON.stringify(candidate, null, 2))
        })
      } catch (error) {
        console.error(`Erro ao buscar candidatos do processo ${process.processTotvsId}:`, error.message)
      }
    }
  }

  private parseApiResponseToCandidates(apiData: any[], processId: number) {
    const candidates = []

    for (const item of apiData) {
      try {
        const attributes = JSON.parse(item.attributes)
        
        // Mapeamento dos campos
        const fieldMap = {}
        attributes.forEach(attr => {
          const label = attr.Label.toLowerCase()
          const value = attr.Values && attr.Values.length > 0 ? attr.Values[0].Caption : ''
          fieldMap[label] = value
        })

        // Determinar se é estrangeiro
        const estrangeiroValue = fieldMap['estrangeiro ?'] || fieldMap['estrangeiro']
        const isForeigner = estrangeiroValue === 'Sim'

        const candidate = {
          processId: processId,
          candidateName: fieldMap['nome completo'] || fieldMap['nome'] || '',
          candidateUniqueDocument: isForeigner 
            ? (fieldMap['n° passaporte'] || fieldMap['passaporte'] || '')
            : (fieldMap['cpf'] || ''),
          candidateEmail: fieldMap['e-mail'] || fieldMap['email'] || '',
          candidatePhone: fieldMap['telefone'] || fieldMap['phone'] || '',
          candidateBirthdate: this.formatDate(fieldMap['data de nascimento'] || fieldMap['nascimento'] || ''),
          candidateForeigner: isForeigner,
          candidateAddress: fieldMap['endereço'] || fieldMap['endereco'] || '',
          candidateAddressNumber: fieldMap['número'] || fieldMap['numero'] || '',
          candidateDistrict: fieldMap['bairro'] || '',
          candidateCity: fieldMap['cidade'] || '',
          candidateState: fieldMap['estado'] || '',
          candidateZipCode: fieldMap['cep'] || '',
          candidateCountry: ''
        }

        candidates.push(candidate)
      } catch (error) {
        console.error('Erro ao processar item da API:', error.message, item)
      }
    }

    return candidates
  }

  private formatDate(dateString: string): string {
    if (!dateString) return ''
    
    // Se já está no formato YYYY-MM-DD, retorna
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }

    // Se está no formato DD/MM/YYYY, converte
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/')
      return `${year}-${month}-${day}`
    }

    return dateString
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