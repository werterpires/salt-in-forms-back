import { Injectable } from '@nestjs/common'
import { CreateSFormDto } from './dto/create-s-form.dto'
import { UpdateSFormDto } from './dto/update-s-form.dto'
import { CopySFormDto } from './dto/copy-s-form.dto'
import { SFormsRepo } from './s-forms.repo'
import { QuestionsRepo } from '../questions/questions.repo'
import * as db from 'src/constants/db-schema.enum'
import { FindAllResponse, Paginator } from 'src/shared/types/types'
import {
  validateCreateDto,
  validateUpdateDto,
  processCopyDto,
  transformCreateDto,
  transformUpdateDto
} from './s-forms.helper'
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
  constructor(
    private readonly sFormsRepo: SFormsRepo,
    private readonly questionsRepo: QuestionsRepo
  ) {}
  async createSForm(createSFormDto: CreateSFormDto) {
    const sFormTypes = await this.sFormsRepo.findAllFormTypesByProcessId(
      createSFormDto.processId
    )

    await validateCreateDto(createSFormDto, sFormTypes, this.questionsRepo)

    const sFormCreateData = transformCreateDto(createSFormDto)

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

  async findAllSFormsSimpleByProcessId(
    processId: number
  ): Promise<SFormSimple[]> {
    return await this.sFormsRepo.findAllSFormsSimpleByProcessId(processId)
  }

  async updateSForm(updateSFormDto: UpdateSFormDto) {
    const sForms = await this.sFormsRepo.findAllFormTypesByProcessId(
      updateSFormDto.sFormId
    )

    await validateUpdateDto(updateSFormDto, sForms, this.questionsRepo)

    const updateFormData = transformUpdateDto(updateSFormDto)

    return await this.sFormsRepo.updateSForm(updateFormData)
  }

  async deleteSForm(sFormId: number) {
    return await this.sFormsRepo.deleteSForm(sFormId)
  }

  async copySForm(copySFormDto: CopySFormDto) {
    // Verificar se o formulário de origem existe
    const sourceForm = await this.sFormsRepo.findFormByFormId(
      copySFormDto.sourceSFormId
    )
    if (!sourceForm) {
      throw new Error('#Formulário de origem não encontrado.')
    }

    const targetForm = await this.sFormsRepo.findAllFormTypesByProcessId(
      copySFormDto.targetFormId
    )

    const copyData = processCopyDto(copySFormDto)

    return await this.sFormsRepo.copySForm(copyData)
  }
}
