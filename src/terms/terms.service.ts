import { BadRequestException, Injectable } from '@nestjs/common'
import { CreateTermDto } from './dto/create-term.dto'
import { CreateTerm, Term, TermFilter } from './types'
import {
  getCreateTermData,
  validateDto,
  validateOpenTerm,
  validateCurrentTermTo,
  getUpdateCase,
  UpdateCases,
  getUpdateTermData,
  getAndValidateOpenTerm
} from './terms.helper'
import { TermsRepo } from './terms.repo'
import { FindAllResponse, Paginator } from 'src/shared/types/types'
import { UpdateTermDto } from './dto/update-term.dto'

@Injectable()
export class TermsService {
  constructor(private readonly termsRepo: TermsRepo) {}
  async createTerm(createTermDto: CreateTermDto) {
    validateDto(createTermDto)

    const openTerm = await this.termsRepo.findCurrentTermByRoleAndType(
      createTermDto.roleId,
      createTermDto.termTypeId
    )

    validateOpenTerm(openTerm)

    const createTermData: CreateTerm = getCreateTermData(createTermDto)

    await this.termsRepo.createTerm(createTermData, openTerm)
  }

  async findAllTerms(paginator: Paginator, filters?: TermFilter) {
    const terms = await this.termsRepo.findAllTerms(paginator, filters)
    const termsQuantity = await this.termsRepo.findTermsQuantity(filters)

    const termsResponse: FindAllResponse<Term> = {
      data: terms,
      pagesQuantity: termsQuantity
    }

    return termsResponse
  }

  async deleteTerm(termId: number) {
    const term = await this.termsRepo.findTermById(termId)
    validateCurrentTermTo(term)

    const lastTermId = await this.termsRepo.findBiggerEndDateTermByRoleAndType(
      term.roleId,
      term.termTypeId
    )

    await this.termsRepo.deleteTerm(termId, lastTermId)
  }

  async updateTerm(updateTermDto: UpdateTermDto) {
    validateDto(updateTermDto)
    const term = await this.termsRepo.findTermById(updateTermDto.termId)
    validateCurrentTermTo(term)
    const updateTermData = getUpdateTermData(updateTermDto)

    let lastTermId: number | undefined
    let openTerm: Term | undefined

    const updateCase = getUpdateCase(updateTermDto, term)

    switch (updateCase) {
      case UpdateCases.TEXT_BEGIN_DATE_TYPE:
        lastTermId = await this.termsRepo.findBiggerEndDateTermByRoleAndType(
          term.roleId,
          term.termTypeId
        )

        openTerm = await getAndValidateOpenTerm(
          updateTermDto.roleId,
          updateTermDto.termTypeId,
          this.termsRepo
        )

        break
      case UpdateCases.TEXT_BEGIN_DATE:
        openTerm = await getAndValidateOpenTerm(
          updateTermDto.roleId,
          updateTermDto.termTypeId,
          this.termsRepo
        )

        break
      case UpdateCases.NOTHING:
        throw new BadRequestException('#Nenhuma informação foi alterada.')
    }

    await this.termsRepo.updateTerm(updateTermData, openTerm, lastTermId)
  }
}
