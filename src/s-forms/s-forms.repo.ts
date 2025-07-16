import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import {
  CreateSForm,
  SForm,
  SFormFilter,
  SFormToValidate,
  UpdateSForm
} from './types'
import * as db from '../constants/db-schema.enum'
import { Paginator } from 'src/shared/types/types'
import { applyFilters } from './s-forms.helper'

@Injectable()
export class SFormsRepo {
  elementsPerPage = 20

  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async createSForm(createSFormData: CreateSForm) {
    return this.knex(db.Tables.S_FORMS).insert(createSFormData)
  }

  async findAllAllFormsByProcessId(
    processId: number,
    orderBy: Paginator<typeof db.SForms>,
    filters?: SFormFilter
  ) {
    const query = this.knex(db.Tables.S_FORMS)
      .select(
        db.SForms.S_FORM_ID,
        db.SForms.S_FORM_NAME,
        db.SForms.S_FORM_TYPE,
        db.SForms.PROCESS_ID
      )
      .where(db.SForms.PROCESS_ID, processId)

    query.orderBy(orderBy.column, orderBy.direction)

    query
      .limit(this.elementsPerPage)
      .offset((orderBy.page - 1 || 0) * this.elementsPerPage)

    if (filters) {
      applyFilters(filters, query)
    }
    return (await query) as SForm[]
  }

  async findAllFormTypesByProcessId(processId: number) {
    return (await this.knex(db.Tables.S_FORMS)
      .select(db.SForms.S_FORM_TYPE, db.SForms.S_FORM_ID)
      .where(db.SForms.PROCESS_ID, processId)) as SFormToValidate[]
  }

  async findSFormQuantityByProcessId(processId: number, filters?: SFormFilter) {
    const query = this.knex(db.Tables.S_FORMS).where(
      db.SForms.PROCESS_ID,
      processId
    )

    if (filters) {
      applyFilters(filters, query)
    }
    query.countDistinct(db.SForms.S_FORM_ID)
    const [results] = await query
    const countKey = Object.keys(results)[0]
    const count = Number(results[countKey])
    return Math.ceil(count / this.elementsPerPage) || 0
  }

  updateSForm(updateSFormDAta: UpdateSForm) {
    const { sFormId, sFormName, sFormType } = updateSFormDAta
    return this.knex(db.Tables.S_FORMS)
      .update({
        [db.SForms.S_FORM_NAME]: sFormName,
        [db.SForms.S_FORM_TYPE]: sFormType
      })
      .where({
        [db.SForms.S_FORM_ID]: sFormId
      })
  }

  deleteSForm(sFormId: number) {
    return this.knex(db.Tables.S_FORMS)
      .delete()
      .where({
        [db.SForms.S_FORM_ID]: sFormId
      })
  }

  async findFormByFormId(sFormId: number) {
    const formConsult = (await this.knex(db.Tables.S_FORMS)
      .select(
        db.SForms.S_FORM_ID,
        db.SForms.S_FORM_NAME,
        db.SForms.S_FORM_TYPE,
        db.SForms.PROCESS_ID
      )
      .where(db.SForms.S_FORM_ID, sFormId)
      .first()) as SForm

    return formConsult
  }
}
