import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import * as db from '../constants/db-schema.enum'
import { CreateFormSection, FormSection, UpdateFormSection } from './types'

@Injectable()
export class FormSectionsRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async findAllBySFormId(sFormId: number): Promise<FormSection[]> {
    return this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.S_FORM_ID, sFormId)
      .orderBy(db.FormSections.FORM_SECTION_ORDER, 'asc')
  }

  async createFormSection(createFormSection: CreateFormSection): Promise<void> {
    await this.knex(db.Tables.FORM_SECTIONS).insert(createFormSection)
  }

  async updateFormSection(updateFormSection: UpdateFormSection): Promise<void> {
    await this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.FORM_SECTION_ID, updateFormSection.formSectionId)
      .update(updateFormSection)
  }

  async deleteFormSection(formSectionId: number): Promise<void> {
    return this.knex.transaction(async (trx) => {
      // Buscar a seção que será deletada para obter sFormId e order
      const sectionToDelete = await trx(db.Tables.FORM_SECTIONS)
        .where(db.FormSections.FORM_SECTION_ID, formSectionId)
        .first()

      if (!sectionToDelete) {
        return
      }

      // Deletar a seção
      await trx(db.Tables.FORM_SECTIONS)
        .where(db.FormSections.FORM_SECTION_ID, formSectionId)
        .del()

      // Decrementar a ordem das seções com order maior que a seção deletada
      await trx(db.Tables.FORM_SECTIONS)
        .where(db.FormSections.S_FORM_ID, sectionToDelete.sFormId)
        .andWhere(db.FormSections.FORM_SECTION_ORDER, '>', sectionToDelete.formSectionOrder)
        .decrement(db.FormSections.FORM_SECTION_ORDER, 1)
    })
  }

  async findById(formSectionId: number): Promise<FormSection | null> {
    const formSection = await this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.FORM_SECTION_ID, formSectionId)
      .first()
    return formSection || null
  }

  async findByIdAndSFormId(
    formSectionId: number,
    sFormId: number
  ): Promise<FormSection | null> {
    const formSection = await this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.FORM_SECTION_ID, formSectionId)
      .andWhere(db.FormSections.S_FORM_ID, sFormId)
      .first()
    return formSection || null
  }

  async incrementOrdersFromPosition(
    sFormId: number,
    fromOrder: number
  ): Promise<void> {
    await this.knex(db.Tables.FORM_SECTIONS)
      .where(db.FormSections.S_FORM_ID, sFormId)
      .andWhere(db.FormSections.FORM_SECTION_ORDER, '>=', fromOrder)
      .increment(db.FormSections.FORM_SECTION_ORDER, 1)
  }

  async createFormSectionWithReorder(
    createFormSection: CreateFormSection
  ): Promise<void> {
    return this.knex.transaction(async (trx) => {
      // Incrementa as ordens das seções a partir da ordem desejada
      await trx(db.Tables.FORM_SECTIONS)
        .where(db.FormSections.S_FORM_ID, createFormSection.sFormId)
        .andWhere(
          db.FormSections.FORM_SECTION_ORDER,
          '>=',
          createFormSection.formSectionOrder
        )
        .increment(db.FormSections.FORM_SECTION_ORDER, 1)

      // Cria a nova seção
      await trx(db.Tables.FORM_SECTIONS).insert(createFormSection)
    })
  }

  async reorderFormSections(
    sections: { formSectionId: number; formSectionOrder: number }[]
  ): Promise<void> {
    await this.knex.transaction(async (trx) => {
      for (const section of sections) {
        await trx(db.Tables.FORM_SECTIONS)
          .where(db.FormSections.FORM_SECTION_ID, section.formSectionId)
          .update({
            [db.FormSections.FORM_SECTION_ORDER]: section.formSectionOrder
          })
      }
    })
  }
}
