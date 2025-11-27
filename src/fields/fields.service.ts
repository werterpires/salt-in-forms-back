import { Injectable } from '@nestjs/common'
import { FieldsRepo } from './fields.repo'
import { FindAllResponse } from '../shared/types/types'
import { buildUnionsWithFields } from './fields.helper'
import { Union } from 'src/ministerials/type'

@Injectable()
export class FieldsService {
  constructor(private readonly fieldsRepo: FieldsRepo) {}

  async findAllUnions(): Promise<FindAllResponse<Union>> {
    const unions = await this.fieldsRepo.findAllUnions()

    const fieldsMap = new Map()

    // Buscar fields para cada union
    for (const union of unions) {
      const fields = await this.fieldsRepo.findFieldsByUnionId(union.unionId)
      fieldsMap.set(union.unionId, fields)
    }

    const unionsWithFields = buildUnionsWithFields(unions, fieldsMap)

    const response: FindAllResponse<Union> = {
      data: unionsWithFields,
      pagesQuantity: 1 // Como limitamos a 1000, assumimos 1 página
    }

    return response
  }
}
