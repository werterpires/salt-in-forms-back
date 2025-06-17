
import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateFormSectionDto } from './dto/create-form-section.dto'
import { UpdateFormSectionDto } from './dto/update-form-section.dto'
import { FormSectionsRepo } from './form-sections.repo'
import { FormSectionsHelper } from './form-sections.helper'
import { FormSection } from './types'

@Injectable()
export class FormSectionsService {
  constructor(private readonly formSectionsRepo: FormSectionsRepo) {}

  async findAllBySFormId(sFormId: number): Promise<FormSection[]> {
    const formSections = await this.formSectionsRepo.findAllBySFormId(sFormId)
    return FormSectionsHelper.sortFormSectionsByOrder(formSections)
  }

  async create(createFormSectionDto: CreateFormSectionDto): Promise<FormSection> {
    const createFormSection = FormSectionsHelper.mapCreateDtoToEntity(createFormSectionDto)
    return this.formSectionsRepo.createFormSection(createFormSection)
  }

  async update(updateFormSectionDto: UpdateFormSectionDto): Promise<FormSection> {
    const existingFormSection = await this.formSectionsRepo.findById(updateFormSectionDto.formSectionId)
    
    if (!existingFormSection) {
      throw new NotFoundException('Seção do formulário não encontrada')
    }

    const updateFormSection = FormSectionsHelper.mapUpdateDtoToEntity(updateFormSectionDto)
    return this.formSectionsRepo.updateFormSection(updateFormSection)
  }

  async remove(formSectionId: number): Promise<void> {
    const existingFormSection = await this.formSectionsRepo.findById(formSectionId)
    
    if (!existingFormSection) {
      throw new NotFoundException('Seção do formulário não encontrada')
    }

    await this.formSectionsRepo.deleteFormSection(formSectionId)
  }
}
