import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { CreateProcess, ProcessesFilter } from './types'
import * as db from '../constants/db-schema.enum'
import { Paginator } from 'src/shared/types/types'

@Injectable()
export class ProcessesRepo {
  elementsPerPage = 20
  // paginator: TestPaginator<typeof db.Processes> = {
  //   column: db.Processes.PROCESS_TITLE,
  //   direction: 'asc',
  //   page: 1
  // }

  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async createProcess(createProcessData: CreateProcess) {
    return this.knex
      .insert(createProcessData)
      .into(db.Tables.PROCESSES)
      .returning(db.Processes.PROCESS_ID)
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
      if (filters.title) {
        query.where(db.Processes.PROCESS_TITLE, 'like', `%${filters.title}%`)
      }

      if (filters.status) {
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
    }

    query.orderBy(orderBy.column, orderBy.direction)

    query
      .limit(this.elementsPerPage)
      .offset((orderBy.page - 1 || 0) * this.elementsPerPage)

    return query
  }
}
