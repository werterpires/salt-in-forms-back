import { Injectable } from '@nestjs/common'
import { CreateMinisterialsDto } from './dto/create-ministerials.dto'
import { MinisterialsRepo } from './ministerials.repo'
import * as db from 'src/constants/db-schema.enum'
import {
  buildMinisterialData,
  compareMinisterialData,
  processMinisterialResults
} from './ministerials.helper'
import { FindAllResponse, Paginator } from 'src/shared/types/types'
import { MinisterialsFilter, CreateMinisterialsTransaction } from './type'

@Injectable()
export class MinisterialsService {
  constructor(private readonly ministerialsRepo: MinisterialsRepo) {}

  async createMinisterials(createMinisterialsDto: CreateMinisterialsDto) {
    // Transform DTO to repository format
    const dataToCreate: CreateMinisterialsTransaction = {
      unions: createMinisterialsDto.unions.map((unionDto) => ({
        unionName: unionDto.unionName,
        unionAcronym: unionDto.unionAcronym,
        fields: unionDto.fields.map((fieldDto) => ({
          fieldName: fieldDto.fieldName,
          fieldAcronym: fieldDto.fieldAcronym,
          ministerial: buildMinisterialData(fieldDto.ministerial, 0) // fieldId will be set in transaction
        }))
      }))
    }

    await this.ministerialsRepo.createMinisterialsWithTransaction(dataToCreate)
  }

  async findAllMinisterials(
    paginator: Paginator<typeof db.Ministerials>,
    filters: MinisterialsFilter
  ): Promise<FindAllResponse<any>> {
    const results = await this.ministerialsRepo.findAllMinisterials(
      paginator,
      filters
    )

    const ministerialsQuantity =
      await this.ministerialsRepo.findMinisterialsQuantity(filters)

    const response: FindAllResponse<any> = {
      data: results,
      pagesQuantity: ministerialsQuantity
    }

    return response
  }
}
