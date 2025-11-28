import { BadRequestException } from '@nestjs/common'
import { Knex } from 'knex'
import * as db from 'src/constants/db-schema.enum'
import { CreateProcessDto } from './dto/create-process.dto'
import { CreateProcess, ProcessesFilter, UpdateProcess } from './types'
import { UpdateProcessDto } from './dto/update-process.dto'
import { getDateFromString } from 'src/shared/utils'

export function validateDto(createProcessDto: CreateProcessDto) {
  const beginDate = getDateFromString(createProcessDto.processBeginDate)
  if (isNaN(beginDate.getTime())) {
    throw new BadRequestException('#Data de início inválida.')
  }

  const endDate = getDateFromString(createProcessDto.processEndDate)
  if (isNaN(endDate.getTime())) {
    throw new BadRequestException('#Data de fim inválida.')
  }

  const endDateAnswers = getDateFromString(createProcessDto.processEndAnswers)

  if (isNaN(endDateAnswers.getTime())) {
    throw new BadRequestException('#Data de fim para respostas inválida.')
  }
  const endDateSubscription = getDateFromString(
    createProcessDto.processEndSubscription
  )

  if (isNaN(endDateSubscription.getTime())) {
    throw new BadRequestException('#Data de fim para inscrições inválida.')
  }

  if (endDateSubscription < beginDate) {
    throw new BadRequestException(
      '#Data de fim para inscrições deve ser maior ou igual que a data de início.'
    )
  }

  if (endDateAnswers < endDateSubscription) {
    throw new BadRequestException(
      '#Data de fim para respostas deve ser maior ou igual que a data de fim para inscrições.'
    )
  }

  if (endDate < endDateAnswers) {
    throw new BadRequestException(
      '#Data de fim deve ser maior ou igual que a data de fim para respostas.'
    )
  }
}

export function makeProcessData(
  createProcessDto: CreateProcessDto
): CreateProcess {
  const beginDate = getDateFromString(createProcessDto.processBeginDate)
  const endDate = getDateFromString(createProcessDto.processEndDate)
  const endDateAnswers = getDateFromString(createProcessDto.processEndAnswers)
  const endDateSubscription = getDateFromString(
    createProcessDto.processEndSubscription
  )

  const processData = {
    [db.Processes.PROCESS_TITLE]: createProcessDto.processTitle,
    [db.Processes.PROCESS_DATA_KEY]: createProcessDto.processDataKey,
    processBeginDate: beginDate,
    processEndDate: endDate,
    processEndAnswers: endDateAnswers,
    processEndSubscription: endDateSubscription
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
