import { CreateFormSection, FormSection, UpdateFormSection } from './types'
import { CreateFormSectionDto } from './dto/create-form-section.dto'
import { UpdateFormSectionDto } from './dto/update-form-section.dto'
import { FormSectionDisplayRules } from '../constants/form-section-display-rules.const'

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

  static validateDisplayRuleAndLink(displayRule: number, displayLink?: number): { isValid: boolean, error?: string } {
    if (!this.validateDisplayRule(displayRule)) {
      return { isValid: false, error: 'Regra de exibição inválida' }
    }

    if (displayRule !== FormSectionDisplayRules.ALWAYS_SHOW && !displayLink) {
      return { isValid: false, error: 'Link de exibição é obrigatório quando a regra não é "Sempre aparecer"' }
    }

    return { isValid: true }
  }

  static processDisplayLink(displayRule: number, displayLink?: number): number | undefined {
    return displayRule === FormSectionDisplayRules.ALWAYS_SHOW ? undefined : displayLink
  }

  static validateDisplayLinkOrder(linkSection: FormSection, newSectionOrder: number): boolean {
    return linkSection.formSectionOrder < newSectionOrder
  }
}
