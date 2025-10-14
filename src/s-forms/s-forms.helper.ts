import {
  SFormFilter,
  SFormToValidate,
  SFormType,
  sFormTypesArray,
  CopySForm,
  CreateSForm,
  UpdateSForm
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

export async function validateUpdateDto(
  updateSFormDto: UpdateSFormDto,
  sForms: SFormToValidate[],
  questionsRepo: any
) {
  const { sFormType, emailQuestionId } = updateSFormDto

  if (!isValidFormType(sFormType)) {
    throw new BadRequestException(`#O tipo do formulário nâo existe.`)
  }

  // Validar emailQuestionId baseado no tipo
  if (sFormType === 'normal') {
    if (!emailQuestionId) {
      throw new BadRequestException(
        `#Formulários do tipo normal devem ter um emailQuestionId.`
      )
    }
    
    // Validar se a questão é do tipo email
    const question = await questionsRepo.findById(emailQuestionId)
    if (!question) {
      throw new BadRequestException(
        `#A questão informada como emailQuestionId não foi encontrada.`
      )
    }
    
    if (question.questionType !== 10) { // EQuestionsTypes.EMAIL
      throw new BadRequestException(
        `#O emailQuestionId deve ser de uma questão do tipo Email.`
      )
    }
  } else {
    if (emailQuestionId) {
      throw new BadRequestException(
        `#Formulários que não são do tipo normal não podem ter emailQuestionId.`
      )
    }
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

export async function validateCreateDto(
  createSFormDto: CreateSFormDto,
  sForms: SFormToValidate[],
  questionsRepo: any
) {
  const { sFormType, emailQuestionId } = createSFormDto

  if (!isValidFormType(sFormType)) {
    throw new BadRequestException(`#O tipo do formulário nâo existe.`)
  }

  // Validar emailQuestionId baseado no tipo
  if (sFormType === 'normal') {
    if (!emailQuestionId) {
      throw new BadRequestException(
        `#Formulários do tipo normal devem ter um emailQuestionId.`
      )
    }
    
    // Validar se a questão é do tipo email
    const question = await questionsRepo.findById(emailQuestionId)
    if (!question) {
      throw new BadRequestException(
        `#A questão informada como emailQuestionId não foi encontrada.`
      )
    }
    
    if (question.questionType !== 10) { // EQuestionsTypes.EMAIL
      throw new BadRequestException(
        `#O emailQuestionId deve ser de uma questão do tipo Email.`
      )
    }
  } else {
    if (emailQuestionId) {
      throw new BadRequestException(
        `#Formulários que não são do tipo normal não podem ter emailQuestionId.`
      )
    }
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

export function transformCreateDto(createSFormDto: CreateSFormDto): CreateSForm {
  return {
    processId: createSFormDto.processId,
    sFormName: createSFormDto.sFormName,
    sFormType: createSFormDto.sFormType as SFormType,
    emailQuestionId: createSFormDto.emailQuestionId
  }
}

export function transformUpdateDto(updateSFormDto: UpdateSFormDto): UpdateSForm {
  const sFormType = updateSFormDto.sFormType as SFormType
  
  return {
    sFormId: updateSFormDto.sFormId,
    sFormName: updateSFormDto.sFormName,
    sFormType: sFormType,
    emailQuestionId: sFormType === 'normal' 
      ? (updateSFormDto.emailQuestionId !== undefined ? updateSFormDto.emailQuestionId : null)
      : null
  }
}

export function processCopyDto(copySFormDto: CopySFormDto): CopySForm {
  return {
    sourceSFormId: copySFormDto.sourceSFormId,
    targetFormId: copySFormDto.targetFormId
  }
}
