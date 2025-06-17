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
    const createFormSection = await FormSectionsHelper.processCreateFormSection(
      createFormSectionDto,
      this.formSectionsRepo
    )
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