import {
  SFormFilter,
  SFormToValidate,
  SFormType,
  sFormTypesArray,
  CopySForm
} from './types'
import { Knex } from 'knex'
import * as db from '../constants/db-schema.enum'
import { CreateSFormDto } from './dto/create-s-form.dto'
import { BadRequestException } from '@nestjs/common'
import { UpdateSFormDto } from './dto/update-s-form.dto'
import { CopySFormDto } from './dto/copy-s-form.dto'

export function applyFilters(filters: SFormFilter, query: Knex.QueryBuilder) {
  if (filters.sFormName) {
    query.where(db.SForms.S_FORM_NAME, 'like', `%${filters.sFormName}%`)
  }
  if (filters.sFormType) {
    query.where(db.SForms.S_FORM_TYPE, `${filters.sFormType}%`)
  }
}

export function validateUpdateDto(
  updateSFormDto: UpdateSFormDto,
  sForms: SFormToValidate[]
) {
  const { sFormType } = updateSFormDto

  if (!isValidFormType(sFormType)) {
    throw new BadRequestException(`#O tipo do formulário nâo existe.`)
  }

  if (sFormType == 'ministerial') {
    if (
      sForms.some(
        (form) =>
          form.sFormType === 'ministerial' &&
          updateSFormDto.sFormId !== form.sFormId
      )
    ) {
      throw new BadRequestException(
        `#O processo já possui um formulário do tipo ministerial.`
      )
    }
  }

  if (sFormType == 'candidate') {
    if (
      sForms.some(
        (form) =>
          form.sFormType === 'candidate' &&
          updateSFormDto.sFormId !== form.sFormId
      )
    ) {
      throw new BadRequestException(
        `#O processo já possui um formulário do tipo candidato.`
      )
    }
  }
}

export function validateCreateDto(
  createSFormDto: CreateSFormDto,
  sForms: SFormToValidate[]
) {
  const { sFormType } = createSFormDto

  if (!isValidFormType(sFormType)) {
    throw new BadRequestException(`#O tipo do formulário nâo existe.`)
  }

  if (sFormType == 'ministerial') {
    if (sForms.some((form) => form.sFormType === 'ministerial')) {
      throw new BadRequestException(
        `#O processo já possui um formulário do tipo ministerial.`
      )
    }
  }

  if (sFormType == 'candidate') {
    if (sForms.some((form) => form.sFormType === 'candidate')) {
      throw new BadRequestException(
        `#O processo já possui um formulário do tipo candidato.`
      )
    }
  }
}

function isValidFormType(value: string): value is SFormType {
  return sFormTypesArray.includes(value as SFormType)
}

export function processCopyDto(copySFormDto: CopySFormDto): CopySForm {
  return {
    sourceSFormId: copySFormDto.sourceSFormId,
    targetFormId: copySFormDto.targetFormId
  }
}
