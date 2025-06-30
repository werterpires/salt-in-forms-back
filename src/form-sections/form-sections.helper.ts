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
      formSectionDisplayRule: dto.formSectionDisplayRule,
      formSectionDisplayLink: dto.formSectionDisplayLink
    }
  }

  static sortFormSectionsByOrder(formSections: FormSection[]): FormSection[] {
    return formSections.sort((a, b) => a.formSectionOrder - b.formSectionOrder)
  }

  static validateDisplayRule(displayRule: number): boolean {
    return Object.values(FormSectionDisplayRules).includes(
      displayRule as FormSectionDisplayRules
    )
  }

  static validateDisplayRuleAndLink(
    displayRule: number,
    displayLink?: number
  ): void {
    if (!this.validateDisplayRule(displayRule)) {
      throw new BadRequestException('#Regra de exibição inválida')
    }

    if (
      (displayRule as FormSectionDisplayRules) !==
        FormSectionDisplayRules.ALWAYS_SHOW &&
      !displayLink
    ) {
      throw new BadRequestException(
        '#Link de exibição é obrigatório quando a regra não é "Sempre aparecer"'
      )
    }
  }

  static processDisplayLink(
    displayRule: number,
    displayLink?: number
  ): number | undefined {
    return (displayRule as FormSectionDisplayRules) ===
      FormSectionDisplayRules.ALWAYS_SHOW
      ? undefined
      : displayLink
  }

  static validateDisplayLinkOrder(
    linkSection: FormSection,
    newSectionOrder: number
  ): void {
    if (linkSection.formSectionOrder >= newSectionOrder) {
      throw new BadRequestException(
        '#A seção referenciada no link de exibição deve ter ordem menor que a seção sendo criada'
      )
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
        throw new BadRequestException(
          '#Seção referenciada no link de exibição não encontrada'
        )
      }

      this.validateDisplayLinkOrder(
        linkedSection,
        createFormSectionDto.formSectionOrder
      )
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

  static async validateReorderData(
    sections: { formSectionId: number; formSectionOrder: number }[],
    formSectionsRepo: FormSectionsRepo
  ): Promise<void> {
    if (sections.length === 0) {
      throw new BadRequestException('#Array de seções não pode estar vazio')
    }

    // Buscar todas as seções para validação
    const firstSectionId = sections[0].formSectionId
    const firstSection = await formSectionsRepo.findById(firstSectionId)

    if (!firstSection) {
      throw new BadRequestException('#Seção não encontrada')
    }

    const sFormId = firstSection.sFormId
    const allFormSections = await formSectionsRepo.findAllBySFormId(sFormId)

    // Validar se todas as seções são do mesmo formulário
    for (const section of sections) {
      const foundSection = allFormSections.find(
        (s) => s.formSectionId === section.formSectionId
      )
      if (!foundSection) {
        throw new BadRequestException(
          '#Todas as seções devem pertencer ao mesmo formulário'
        )
      }
    }

    // Validar se todas as seções do formulário estão no array
    if (sections.length !== allFormSections.length) {
      throw new BadRequestException(
        '#Todas as seções do formulário devem estar presentes no array'
      )
    }

    // Validar se todos os IDs do formulário estão no array
    const sectionIds = sections
      .map((s) => s.formSectionId)
      .sort((a, b) => a - b)
    const formSectionIds = allFormSections
      .map((s) => s.formSectionId)
      .sort((a, b) => a - b)

    if (JSON.stringify(sectionIds) !== JSON.stringify(formSectionIds)) {
      throw new BadRequestException(
        '#Todas as seções do formulário devem estar presentes no array'
      )
    }

    // Validar ordenação sequencial sem saltos nem repetições
    const orders = sections.map((s) => s.formSectionOrder).sort((a, b) => a - b)

    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        throw new BadRequestException(
          '#A ordenação deve ser sequencial, começando em 1, sem saltos ou repetições'
        )
      }
    }

    sections.forEach((incomingSection) => {
      const currentSection = allFormSections.find(
        (s) => s.formSectionId === incomingSection.formSectionId
      )
      if (!currentSection) {
        throw new BadRequestException('#Seção não encontrada')
      }

      if (currentSection.formSectionDisplayRule !== 1) {
        const sectionLinkId = currentSection.formSectionDisplayLink

        const sectionLink = allFormSections.find(
          (s) => s.formSectionId === sectionLinkId
        )
        if (!sectionLink) {
          throw new BadRequestException('#Seção referenciada não encontrada')
        }

        if (sectionLink.formSectionOrder >= incomingSection.formSectionOrder) {
          throw new BadRequestException(
            `#A seção ${currentSection.formSectionName} depende da seção ${sectionLink.formSectionName}. Por isso a seção ${sectionLink.formSectionName} deve estar antes da seção ${currentSection.formSectionName}`
          )
        }
      }
    })
  }
}
