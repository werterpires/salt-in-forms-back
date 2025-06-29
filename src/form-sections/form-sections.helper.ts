import { CreateFormSection, FormSection, UpdateFormSection } from './types'
import { CreateFormSectionDto } from './dto/create-form-section.dto'
import { UpdateFormSectionDto } from './dto/update-form-section.dto'

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
}
