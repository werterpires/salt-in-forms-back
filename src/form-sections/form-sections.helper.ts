
import { CreateFormSection, FormSection, UpdateFormSection } from './types'
import { CreateFormSectionDto } from './dto/create-form-section.dto'
import { UpdateFormSectionDto } from './dto/update-form-section.dto'
import { FormSectionDisplayRules } from '../constants/form-section-display-rules.const'
import { BadRequestException } from '@nestjs/common'
import { FormSectionsRepo } from './form-sections.repo'

export class FormSectionsHelper {
  static mapCreateDtoToEntity(dto: CreateFormSectionDto): CreateFormSection {
    return {
      sFormId: dto.sFormId,
      formSectionName: dto.formSectionName,
      formSectionOrder: dto.formSectionOrder,
      formSectionDisplayRule: dto.formSectionDisplayRule,
      formSectionDisplayLink: dto.formSectionDisplayLink
    }
  }

  static mapUpdateDtoToEntity(dto: UpdateFormSectionDto): UpdateFormSection {
    return {
      formSectionId: dto.formSectionId,
      formSectionName: dto.formSectionName,
      formSectionOrder: dto.formSectionOrder,
      formSectionDisplayRule: dto.formSectionDisplayRule,
      formSectionDisplayLink: dto.formSectionDisplayLink
    }
  }

  static sortFormSectionsByOrder(formSections: FormSection[]): FormSection[] {
    return formSections.sort((a, b) => a.formSectionOrder - b.formSectionOrder)
  }

  static validateDisplayRule(displayRule: number): boolean {
    return Object.values(FormSectionDisplayRules).includes(displayRule as FormSectionDisplayRules)
  }

  static validateDisplayRuleAndLink(displayRule: number, displayLink?: number): void {
    if (!this.validateDisplayRule(displayRule)) {
      throw new BadRequestException('#Regra de exibição inválida')
    }

    if (displayRule !== FormSectionDisplayRules.ALWAYS_SHOW && !displayLink) {
      throw new BadRequestException('#Link de exibição é obrigatório quando a regra não é "Sempre aparecer"')
    }
  }

  static processDisplayLink(displayRule: number, displayLink?: number): number | undefined {
    return displayRule === FormSectionDisplayRules.ALWAYS_SHOW ? undefined : displayLink
  }

  static validateDisplayLinkOrder(linkSection: FormSection, newSectionOrder: number): void {
    if (linkSection.formSectionOrder >= newSectionOrder) {
      throw new BadRequestException('#A seção referenciada no link de exibição deve ter ordem menor que a seção sendo criada')
    }
  }

  static async processCreateFormSection(
    createFormSectionDto: CreateFormSectionDto,
    formSectionsRepo: FormSectionsRepo
  ): Promise<CreateFormSection> {
    // 1. Validar se a regra de exibição é válida
    this.validateDisplayRuleAndLink(
      createFormSectionDto.formSectionDisplayRule,
      createFormSectionDto.formSectionDisplayLink
    )

    // 2. Se há um displayLink, validar se a seção referenciada existe e tem ordem menor
    if (createFormSectionDto.formSectionDisplayLink) {
      const linkedSection = await formSectionsRepo.findByIdAndSFormId(
        createFormSectionDto.formSectionDisplayLink,
        createFormSectionDto.sFormId
      )

      if (!linkedSection) {
        throw new BadRequestException('#Seção referenciada no link de exibição não encontrada')
      }

      this.validateDisplayLinkOrder(linkedSection, createFormSectionDto.formSectionOrder)
    }

    // 3. Processar o displayLink conforme a regra
    const processedDisplayLink = this.processDisplayLink(
      createFormSectionDto.formSectionDisplayRule,
      createFormSectionDto.formSectionDisplayLink
    )

    return {
      ...this.mapCreateDtoToEntity(createFormSectionDto),
      formSectionDisplayLink: processedDisplayLink
    }
  }
}
