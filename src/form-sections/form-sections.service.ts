import { Injectable } from '@nestjs/common'
import { FormSectionsRepo } from './form-sections.repo'
import { CreateFormSectionDto } from './dto/create-form-section.dto'
import { UpdateFormSectionDto } from './dto/update-form-section.dto'
import { ReorderFormSectionsDto } from './dto/reorder-form-sections.dto'
import { FormSection } from './types'
import { FormSectionsHelper } from './form-sections.helper'

@Injectable()
export class FormSectionsService {
  constructor(private readonly formSectionsRepo: FormSectionsRepo) {}

  async findAllBySFormId(sFormId: number): Promise<FormSection[]> {
    const formSections = await this.formSectionsRepo.findAllBySFormId(sFormId)
    console.log('formSecions', formSections)
    return FormSectionsHelper.sortFormSectionsByOrder(formSections)
  }

  async create(createFormSectionDto: CreateFormSectionDto): Promise<void> {
    const createFormSection = await FormSectionsHelper.processCreateFormSection(
      createFormSectionDto,
      this.formSectionsRepo
    )
    return this.formSectionsRepo.createFormSectionWithReorder(createFormSection)
  }

  async update(updateFormSectionDto: UpdateFormSectionDto): Promise<void> {
    const updateFormSection = await FormSectionsHelper.processUpdateFormSection(
      updateFormSectionDto,
      this.formSectionsRepo
    )
    return this.formSectionsRepo.updateFormSection(updateFormSection)
  }

  async remove(formSectionId: number): Promise<void> {
    // Validar se a seção pode ser excluída (verificar vínculos)
    await FormSectionsHelper.validateSectionDeletion(
      formSectionId,
      this.formSectionsRepo
    )

    return this.formSectionsRepo.deleteFormSection(formSectionId)
  }

  async reorder(reorderFormSectionsDto: ReorderFormSectionsDto): Promise<void> {
    await FormSectionsHelper.validateReorderData(
      reorderFormSectionsDto.sections,
      this.formSectionsRepo
    )
    return this.formSectionsRepo.reorderFormSections(
      reorderFormSectionsDto.sections
    )
  }
}
