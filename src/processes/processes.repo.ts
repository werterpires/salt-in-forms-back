import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { CreateProcess, ProcessesFilter, ProcessSimple, UpdateProcess } from './types'
import * as db from '../constants/db-schema.enum'
import { Paginator } from 'src/shared/types/types'
import { applyFilters } from './processes.helper'

@Injectable()
export class ProcessesRepo {
  elementsPerPage = 20

  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async createProcess(createProcessData: CreateProcess) {
    return this.knex.insert(createProcessData).into(db.Tables.PROCESSES)
  }

  async findAllProcesses(
    orderBy: Paginator<typeof db.Processes>,
    filters?: ProcessesFilter
  ) {
    const query = this.knex(db.Tables.PROCESSES).select(
      db.Processes.PROCESS_ID,
      db.Processes.PROCESS_TITLE,
      db.Processes.PROCESS_TOTVS_ID,
      db.Processes.PROCESS_BEGIN_DATE,
      db.Processes.PROCESS_END_DATE
    )

    if (filters) {
      applyFilters(filters, query)
    }

    query.orderBy(orderBy.column, orderBy.direction)

    query
      .limit(this.elementsPerPage)
      .offset((orderBy.page - 1 || 0) * this.elementsPerPage)

    return await query
  }

  async updateProcess(updateProcessData: UpdateProcess) {
    return this.knex
      .update({
        [db.Processes.PROCESS_TITLE]:
          updateProcessData[db.Processes.PROCESS_TITLE],
        [db.Processes.PROCESS_TOTVS_ID]:
          updateProcessData[db.Processes.PROCESS_TOTVS_ID],
        [db.Processes.PROCESS_BEGIN_DATE]:
          updateProcessData[db.Processes.PROCESS_BEGIN_DATE],
        [db.Processes.PROCESS_END_DATE]:
          updateProcessData[db.Processes.PROCESS_END_DATE]
      })
      .into(db.Tables.PROCESSES)
      .where(
        db.Processes.PROCESS_ID,
        updateProcessData[db.Processes.PROCESS_ID]
      )
  }

  async deleteProcess(processId: number) {
    return this.knex
      .delete()
      .from(db.Tables.PROCESSES)
      .where(db.Processes.PROCESS_ID, processId)
  }

  async findAllProcessesSimple(): Promise<ProcessSimple[]> {
    return this.knex(db.Tables.PROCESSES)
      .select(db.Processes.PROCESS_ID, db.Processes.PROCESS_TITLE)
      .orderBy(db.Processes.PROCESS_TITLE, 'asc')
  }

  async findProcessQuantity(filters?: ProcessesFilter) {
    const query = this.knex(db.Tables.PROCESSES)

    if (filters) {
      applyFilters(filters, query)
    }

    query.countDistinct(db.Processes.PROCESS_ID)
    const [results] = await query

    const countKey = Object.keys(results)[0]
    const count = Number(results[countKey])
    return Math.ceil(count / this.elementsPerPage) || 0
  }
}
