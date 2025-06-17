import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectKnex } from 'nestjs-knex'
import * as db from '../constants/db-schema.enum'
import { CreateFormSection, FormSection, UpdateFormSection } from './types'

@Injectable()
export class FormSectionsRepo {
  constructor(@InjectKnex() private readonly knex: Knex) {}

  async findAllBySFormId(sFormId: number): Promise<FormSection[]> {
    return this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.S_FORM_ID, sFormId)
      .orderBy(db.FormSections.FORM_SECTION_ORDER, 'asc')
  }

  async createFormSection(createFormSection: CreateFormSection): Promise<FormSection> {
    const [formSection] = await this.knex(db.Tables.FORM_SECTIONS)
      .insert(createFormSection)
      .returning('*')
    return formSection
  }

  async updateFormSection(updateFormSection: UpdateFormSection): Promise<FormSection> {
    const [formSection] = await this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.FORM_SECTION_ID, updateFormSection.formSectionId)
      .update(updateFormSection)
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

  async findByIdAndSFormId(formSectionId: number, sFormId: number): Promise<FormSection | null> {
    const formSection = await this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.FORM_SECTION_ID, formSectionId)
      .andWhere(db.FormSections.S_FORM_ID, sFormId)
      .first()
    return formSection || null
  }

  async incrementOrdersFromPosition(sFormId: number, fromOrder: number): Promise<void> {
    await this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.S_FORM_ID, sFormId)
      .andWhere(db.FormSections.FORM_SECTION_ORDER, '>=', fromOrder)
      .increment(db.FormSections.FORM_SECTION_ORDER, 1)
  }

  async createFormSectionWithReorder(createFormSection: CreateFormSection): Promise<FormSection> {
    return this.knex.transaction(async (trx) => {
      // Incrementa as ordens das seções a partir da ordem desejada
      await trx(db.Tables.FORM_SECTIONS)
        .where(db.FormSections.S_FORM_ID, createFormSection.sFormId)
        .andWhere(db.FormSections.FORM_SECTION_ORDER, '>=', createFormSection.formSectionOrder)
        .increment(db.FormSections.FORM_SECTION_ORDER, 1)

      // Cria a nova seção
      const [formSection] = await trx(db.Tables.FORM_SECTIONS)
        .insert(createFormSection)
        .returning('*')

      return formSection
    })
  }

  async reorderFormSections(sections: { formSectionId: number; formSectionOrder: number }[]): Promise<FormSection[]> {
    return this.knex.transaction(async (trx) => {
      const updatedSections: FormSection[] = []

      for (const section of sections) {
        const [updatedSection] = await trx(db.Tables.FORM_SECTIONS)
          .where(db.FormSections.FORM_SECTION_ID, section.formSectionId)
          .update({ [db.FormSections.FORM_SECTION_ORDER]: section.formSectionOrder })
          .returning('*')
        
        updatedSections.push(updatedSection)
      }

      return updatedSections.sort((a, b) => a.formSectionOrder - b.formSectionOrder)
    })
  }
}