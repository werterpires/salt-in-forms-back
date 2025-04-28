import { CreateTerm, Term, TermFilter, UpdateTerm } from './types'
import { CreateTermDto } from './dto/create-term.dto'
import { BadRequestException } from '@nestjs/common'
import { ERoles } from 'src/constants/roles.const'
import { ETermsTypes } from 'src/constants/terms-types.const'
import { UpdateTermDto } from './dto/update-term.dto'
import { TermsRepo } from './terms.repo'
import { Knex } from 'knex'
import * as db from 'src/constants/db-schema.enum'

export enum UpdateCases {
  TEXT_BEGIN_DATE_TYPE = 3,
  TEXT_BEGIN_DATE = 2,
  TEXT = 1,
  NOTHING = 0
}

export function getUpdateCase(
  updateTermDto: UpdateTermDto,
  term: Term
): UpdateCases {
  const diferentText = updateTermDto.termText !== term.termText
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
  const diferentType = updateTermDto.termTypeId != term.termTypeId
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
  const diferentRole = updateTermDto.roleId != term.roleId
  const diferentBeginDate =
    new Date(updateTermDto.beginDate).getTime() !== term.beginDate.getTime()

  if (diferentType || diferentRole) {
    return UpdateCases.TEXT_BEGIN_DATE_TYPE
  } else if (diferentText && diferentBeginDate) {
    return UpdateCases.TEXT_BEGIN_DATE
  } else if (diferentText) {
    return UpdateCases.TEXT
  } else {
    return UpdateCases.NOTHING
  }
}

export function getCreateTermData(createTermDto: CreateTermDto): CreateTerm {
  const beginDate = new Date(createTermDto.beginDate)

  const createTermData: CreateTerm = {
    ...createTermDto,
    beginDate
  }

  return createTermData
}

export function getUpdateTermData(updateTermDto: UpdateTermDto) {
  const createDto = getCreateTermData(updateTermDto)
  const updateDto: UpdateTerm = {
    ...createDto,
    termId: updateTermDto.termId
  }
  return updateDto
}

export async function getAndValidateOpenTerm(
  roleId: number,
  termTypeId: number,
  repo: TermsRepo
) {
  const openTerm = await repo.findCurrentTermByRoleAndType(roleId, termTypeId)
  validateOpenTerm(openTerm)
  return openTerm
}

export function validateDto(createTermDto: CreateTermDto) {
  const beginDate = new Date(createTermDto.beginDate)

  if (Object.values(ERoles).includes(createTermDto.roleId) === false) {
    throw new BadRequestException('#Papel de usuário inválido.')
  }

  if (Object.values(ETermsTypes).includes(createTermDto.termTypeId) === false) {
    throw new BadRequestException('#Tipo de termos inválido.')
  }

  if (isNaN(beginDate.getTime())) {
    throw new BadRequestException('#Data de início inválida.')
  }

  if (beginDate <= new Date()) {
    throw new BadRequestException(
      '#Data de início deve ser maior que a data atual.'
    )
  }
}

export function validateOpenTerm(currentTerm: Term | undefined) {
  if (currentTerm !== undefined) {
    const openTermIsActive = currentTerm.beginDate > new Date()
    if (!openTermIsActive) {
      throw new BadRequestException(
        '#Você já criou um termo substituto para o papel e tipo de termo selecionado. '
      )
    }
  }
}

export function subtractDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

export function validateCurrentTermTo(term: Term) {
  if (term.beginDate <= new Date()) {
    throw new BadRequestException(
      '#Termo não pode ser excluído ou editado, pois ele está ou já esteve ativo.'
    )
  }
}

export function applyFilters(filters: TermFilter, query: Knex.QueryBuilder) {
  if (filters.roleId !== undefined) {
    query.where(db.Terms.ROLE_ID, filters.roleId)
  }

  if (filters.termTypeId !== undefined) {
    query.where(db.Terms.TERM_TYPE_ID, filters.termTypeId)
  }

  if (filters.onlyActive !== undefined) {
    const now = new Date()

    if (filters.onlyActive) {
      query.where((qb) => {
        qb.where(db.Terms.BEGIN_DATE, '<=', now).andWhere((subQb) => {
          subQb
            .whereNull(db.Terms.END_DATE)
            .orWhere(db.Terms.END_DATE, '>=', now)
        })
      })
    } else {
      query.where((qb) => {
        qb.where(db.Terms.BEGIN_DATE, '>=', now).orWhere((subQb) => {
          subQb
            .where(db.Terms.BEGIN_DATE, '<=', now)
            .andWhere(db.Terms.END_DATE, '<=', now)
        })
      })
    }
  }
}
