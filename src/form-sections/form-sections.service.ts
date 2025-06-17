import { Injectable, BadRequestException } from '@nestjs/common'
import { FormSectionsRepo } from './form-sections.repo'
import { CreateFormSectionDto } from './dto/create-form-section.dto'
import { UpdateFormSectionDto } from './dto/update-form-section.dto'
import { FormSection } from './types'
import { FormSectionsHelper } from './form-sections.helper'

@Injectable()
export class FormSectionsService {
  constructor(private readonly formSectionsRepo: FormSectionsRepo) {}

  async findAllBySFormId(sFormId: number): Promise<FormSection[]> {
    const formSections = await this.formSectionsRepo.findAllBySFormId(sFormId)
    return FormSectionsHelper.sortFormSectionsByOrder(formSections)
  }

  async create(createFormSectionDto: CreateFormSectionDto): Promise<FormSection> {
    // 1. Validar se a regra de exibição é válida
    const { isValid, error } = FormSectionsHelper.validateDisplayRuleAndLink(
      createFormSectionDto.formSectionDisplayRule,
      createFormSectionDto.formSectionDisplayLink
    )

    if (!isValid) {
      throw new BadRequestException(error)
    }

    // 2. Se há um displayLink, validar se a seção referenciada existe e tem ordem menor
    if (createFormSectionDto.formSectionDisplayLink) {
      const linkedSection = await this.formSectionsRepo.findByIdAndSFormId(
        createFormSectionDto.formSectionDisplayLink,
        createFormSectionDto.sFormId
      )

      if (!linkedSection) {
        throw new BadRequestException('Seção referenciada no link de exibição não encontrada')
      }

      if (!FormSectionsHelper.validateDisplayLinkOrder(linkedSection, createFormSectionDto.formSectionOrder)) {
        throw new BadRequestException('A seção referenciada no link de exibição deve ter ordem menor que a seção sendo criada')
      }
    }

    // 3. Processar o displayLink conforme a regra
    const processedDisplayLink = FormSectionsHelper.processDisplayLink(
      createFormSectionDto.formSectionDisplayRule,
      createFormSectionDto.formSectionDisplayLink
    )

    const createFormSection = {
      ...FormSectionsHelper.mapCreateDtoToEntity(createFormSectionDto),
      formSectionDisplayLink: processedDisplayLink
    }

    // 4. Criar com reordenação automática
    return this.formSectionsRepo.createFormSectionWithReorder(createFormSection)
  }

  async update(updateFormSectionDto: UpdateFormSectionDto): Promise<FormSection> {
    const updateFormSection = FormSectionsHelper.mapUpdateDtoToEntity(updateFormSectionDto)
    return this.formSectionsRepo.updateFormSection(updateFormSection)
  }

  async remove(formSectionId: number): Promise<void> {
    return this.formSectionsRepo.deleteFormSection(formSectionId)
  }
}