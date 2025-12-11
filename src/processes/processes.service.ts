import { Injectable, BadRequestException } from '@nestjs/common'
import { CreateProcessDto } from './dto/create-process.dto'
import { UpdateProcessDto } from './dto/update-process.dto'
import { ProcessesRepo } from './processes.repo'
import {
  makeProcessData,
  makeUpdateProcessData,
  validateDto
} from './processes.helper'
import { FindAllResponse, Paginator } from 'src/shared/types/types'
import * as db from 'src/constants/db-schema.enum'
import { Process, ProcessesFilter, ProcessSimple } from './types'

@Injectable()
export class ProcessesService {
  constructor(private readonly processesRepo: ProcessesRepo) {}

  async createProcess(createProcessDto: CreateProcessDto) {
    validateDto(createProcessDto)

    const processData = makeProcessData(createProcessDto)
    return this.processesRepo.createProcess(processData)
  }

  async findAllProcesses(
    paginator: Paginator<typeof db.Processes>,
    filters: ProcessesFilter
  ): Promise<FindAllResponse<Process>> {
    const processes = await this.processesRepo.findAllProcesses(
      paginator,
      filters
    )
    const processesQuantity =
      await this.processesRepo.findProcessQuantity(filters)

    const response: FindAllResponse<Process> = {
      data: processes,
      pagesQuantity: processesQuantity
    }
    return response
  }

  async updateProcess(updateProcessDto: UpdateProcessDto) {
    // Verificar se o processo já terminou
    const existingProcess = await this.processesRepo.findProcessById(
      updateProcessDto.processId
    )
    if (existingProcess) {
      const today = new Date()
      const processEndDate = new Date(existingProcess.processEndDate)

      if (today > processEndDate) {
        throw new BadRequestException(
          '#Não é possível editar processos que já terminaram.'
        )
      }
    }

    validateDto(updateProcessDto)
    const updateProcessData = makeUpdateProcessData(updateProcessDto)
    return this.processesRepo.updateProcess(updateProcessData)
  }

  async findAllProcessesSimple(): Promise<ProcessSimple[]> {
    return await this.processesRepo.findAllProcessesSimple()
  }

  async deleteProcess(processId: number) {
    // Verificar se o processo já terminou
    const existingProcess = await this.processesRepo.findProcessById(processId)
    if (existingProcess) {
      const today = new Date()
      const processEndDate = new Date(existingProcess.processEndDate)

      if (today > processEndDate) {
        throw new BadRequestException(
          '#Não é possível remover processos que já terminaram.'
        )
      }
    }

    return this.processesRepo.deleteProcess(processId)
  }

  async findActiveProcesses() {
    return await this.processesRepo.findActiveProcesses()
  }
}
