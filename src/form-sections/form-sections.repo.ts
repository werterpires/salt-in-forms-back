
import { Injectable } from '@nestjs/common'
import * as knex from 'knex'
import * as db from '../constants/db-schema.enum'
import { CreateFormSection, FormSection, UpdateFormSection } from './types'

@Injectable()
export class FormSectionsRepo {
  constructor(private readonly knex: knex.Knex) {}

  async findAllBySFormId(sFormId: number): Promise<FormSection[]> {
    return this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.S_FORM_ID, sFormId)
      .orderBy(db.FormSections.FORM_SECTION_ORDER, 'asc')
      .select('*')
  }

  async createFormSection(createFormSection: CreateFormSection): Promise<FormSection> {
    const [formSection] = await this.knex(db.Tables.FORM_SECTIONS)
      .insert(createFormSection)
      .returning('*')
    return formSection
  }

  async updateFormSection(updateFormSection: UpdateFormSection): Promise<FormSection> {
    const { formSectionId, ...updateData } = updateFormSection
    
    const [formSection] = await this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.FORM_SECTION_ID, formSectionId)
      .update(updateData)
      .returning('*')
    
    return formSection
  }

  async deleteFormSection(formSectionId: number): Promise<void> {
    await this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.FORM_SECTION_ID, formSectionId)
      .del()
  }

  async findById(formSectionId: number): Promise<FormSection | null> {
    const formSection = await this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.FORM_SECTION_ID, formSectionId)
      .first()
    
    return formSection || null
  }
}
