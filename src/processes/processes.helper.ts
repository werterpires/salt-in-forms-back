import { BadRequestException } from '@nestjs/common'
import { Knex } from 'knex'
import * as db from 'src/constants/db-schema.enum'
import { CreateProcessDto } from './dto/create-process.dto'
import { CreateProcess, ProcessesFilter, UpdateProcess } from './types'
import { UpdateProcessDto } from './dto/update-process.dto'

export function validateDto(createProcessDto: CreateProcessDto) {
  const beginDate = new Date(createProcessDto.processBeginDate)
  if (isNaN(beginDate.getTime())) {
    throw new BadRequestException('#Data de início inválida.')
  }

  if (createProcessDto.processEndDate) {
    const endDate = new Date(createProcessDto.processEndDate)
    if (isNaN(endDate.getTime())) {
      throw new BadRequestException('#Data de fim inválida.')
    }

    if (endDate < beginDate) {
      throw new BadRequestException(
        '#Data de fim deve ser maior ou igual que a data de início.'
      )
    }
  }
}

export function makeProcessData(
  createProcessDto: CreateProcessDto
): CreateProcess {
  const beginDate = new Date(createProcessDto.processBeginDate)
  const endDate = createProcessDto.processEndDate
    ? new Date(createProcessDto.processEndDate)
    : undefined
  const processData = {
    [db.Processes.PROCESS_TITLE]: createProcessDto.processTitle,
    processTotvsId: createProcessDto.processTotvsId,
    processBeginDate: beginDate,
    processEndDate: endDate
  }
  return processData
}

export function makeUpdateProcessData(updateProcessDto: UpdateProcessDto) {
  const createData = makeProcessData(updateProcessDto)
  const updateData: UpdateProcess = {
    ...createData,
    [db.Processes.PROCESS_ID]: updateProcessDto.processId
  }

  return updateData
}

export function applyFilters(
  filters: ProcessesFilter,
  query: Knex.QueryBuilder
) {
  switch (filters.status) {
    case 'draft':
      query.where(db.Processes.PROCESS_BEGIN_DATE, '>', new Date())
      break
    case 'active':
      query.where(db.Processes.PROCESS_BEGIN_DATE, '<=', new Date())
      query.where(function () {
        this.whereNull(db.Processes.PROCESS_END_DATE).orWhere(
          db.Processes.PROCESS_END_DATE,
          '>=',
          new Date()
        )
      })
      break
    case 'completed':
      query.where(db.Processes.PROCESS_END_DATE, '<', new Date())
      break
  }
}
