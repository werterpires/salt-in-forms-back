import { Injectable } from '@nestjs/common'
import { CreateSFormDto } from './dto/create-s-form.dto'
import { UpdateSFormDto } from './dto/update-s-form.dto'
import { CopySFormDto } from './dto/copy-s-form.dto'
import { SFormsRepo } from './s-forms.repo'
import * as db from 'src/constants/db-schema.enum'
import { FindAllResponse, Paginator } from 'src/shared/types/types'
import { validateCreateDto, validateUpdateDto, validateCopyDto, processCopyDto } from './s-forms.helper'
import {
  CreateSForm,
  SForm,
  SFormFilter,
  SFormType,
  UpdateSForm,
  SFormSimple
} from './types'

@Injectable()
export class SFormsService {
  constructor(private readonly sFormsRepo: SFormsRepo) {}
  async createSForm(createSFormDto: CreateSFormDto) {
    const sFormTypes = await this.sFormsRepo.findAllFormTypesByProcessId(
      createSFormDto.processId
    )

    validateCreateDto(createSFormDto, sFormTypes)

    const sFormCreateData: CreateSForm = {
      processId: createSFormDto.processId,
      sFormName: createSFormDto.sFormName,
      sFormType: createSFormDto.sFormType as SFormType
    }

    return await this.sFormsRepo.createSForm(sFormCreateData)
  }

  
  async findAllformsByProcessId(
    processId: number,
    orderBy: Paginator<typeof db.SForms>,
    filters?: SFormFilter
  ) {
    const sForms = await this.sFormsRepo.findAllAllFormsByProcessId(
      processId,
      orderBy,
      filters
    )

    const sFormsQuantity = await this.sFormsRepo.findSFormQuantityByProcessId(
      processId,
      filters
    )

    const response: FindAllResponse<SForm> = {
      data: sForms,
      pagesQuantity: sFormsQuantity
    }

    return response
  }

  async findSFormById(sFormId: number) {
    return await this.sFormsRepo.findFormByFormId(sFormId)
  }

  async findAllSFormsSimpleByProcessId(processId: number): Promise<SFormSimple[]> {
    return await this.sFormsRepo.findAllSFormsSimpleByProcessId(processId)
  }

  async updateSForm(updateSFormDto: UpdateSFormDto) {
    const sForms = await this.sFormsRepo.findAllFormTypesByProcessId(
      updateSFormDto.sFormId
    )

    validateUpdateDto(updateSFormDto, sForms)

    const updateFormDate: UpdateSForm = {
      sFormId: updateSFormDto.sFormId,
      sFormName: updateSFormDto.sFormName,
      sFormType: updateSFormDto.sFormType as SFormType
    }

    return await this.sFormsRepo.updateSForm(updateFormDate)
  }

  async deleteSForm(sFormId: number) {
    return await this.sFormsRepo.deleteSForm(sFormId)
  }

  async copySForm(copySFormDto: CopySFormDto) {
    // Verificar se o formulário de origem existe
    const sourceForm = await this.sFormsRepo.findFormByFormId(copySFormDto.sourceSFormId)
    if (!sourceForm) {
      throw new Error('#Formulário de origem não encontrado.')
    }

    // Validar o processo de destino
    const targetProcessForms = await this.sFormsRepo.findAllFormTypesByProcessId(
      copySFormDto.targetProcessId
    )

    validateCopyDto(copySFormDto, targetProcessForms, sourceForm.sFormType)

    const copyData = processCopyDto(copySFormDto)

    return await this.sFormsRepo.copySForm(copyData, sourceForm.sFormType)
  }
}
