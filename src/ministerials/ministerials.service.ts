
import { Injectable } from '@nestjs/common'
import { CreateMinisterialsDto } from './dto/create-ministerials.dto'
import { MinisterialsRepo } from './ministerials.repo'
import * as db from 'src/constants/db-schema.enum'
import { buildMinisterialData, compareMinisterialData, processMinisterialResults } from './ministerials.helper'
import { FindAllResponse, Paginator } from 'src/shared/types/types'
import { MinisterialsFilter } from './type'

@Injectable()
export class MinisterialsService {
  constructor(private readonly ministerialsRepo: MinisterialsRepo) {}

  async createMinisterials(createMinisterialsDto: CreateMinisterialsDto) {
    for (const unionDto of createMinisterialsDto.unions) {
      // 1. Check if union exists, if not create it
      let union = await this.ministerialsRepo.findUnionByNameOrAcronym(
        unionDto.unionName,
        unionDto.unionAcronym
      )

      let unionId: number
      if (union) {
        unionId = union[db.Unions.UNION_ID]
      } else {
        unionId = await this.ministerialsRepo.createUnion({
          [db.Unions.UNION_NAME]: unionDto.unionName,
          [db.Unions.UNION_ACRONYM]: unionDto.unionAcronym
        })
      }

      // 2. Process fields
      for (const fieldDto of unionDto.fields) {
        // Check if field exists, if not create it
        let field = await this.ministerialsRepo.findFieldByNameOrAcronym(
          fieldDto.fieldName,
          fieldDto.fieldAcronym
        )

        let fieldId: number
        if (field) {
          fieldId = field[db.Fields.FIELD_ID]
        } else {
          fieldId = await this.ministerialsRepo.createField({
            [db.Fields.FIELD_NAME]: fieldDto.fieldName,
            [db.Fields.FIELD_ACRONYM]: fieldDto.fieldAcronym,
            [db.Fields.UNION_ID]: unionId
          })
        }

        // 3. Process ministerial
        const ministerialDto = fieldDto.ministerial
        
        // Check if ministerial with this name exists
        const existingMinisterials = await this.ministerialsRepo.findAllMinisterialsByName(
          ministerialDto.ministerialName
        )

        const ministerialData = buildMinisterialData(ministerialDto, fieldId)

        if (existingMinisterials.length === 0) {
          // Case 1: Name doesn't exist, deactivate others from same field and insert new record
          await this.ministerialsRepo.deactivateMinisterialsByField(fieldId)
          await this.ministerialsRepo.createMinisterial(ministerialData)
        } else {
          // Case 2: Name exists, compare data
          const hasSameData = existingMinisterials.some((existing) =>
            compareMinisterialData(existing, ministerialData)
          )

          if (!hasSameData) {
            // Data is different, deactivate others from same field and insert new record
            await this.ministerialsRepo.deactivateMinisterialsByField(fieldId)
            await this.ministerialsRepo.createMinisterial(ministerialData)
          }
          // else: Data is the same, ignore
        }
      }
    }
  }

  async findAllMinisterials(
    paginator: Paginator<typeof db.Ministerials>,
    filters: MinisterialsFilter
  ): Promise<FindAllResponse<any>> {
    const results = await this.ministerialsRepo.findAllMinisterials(
      paginator,
      filters
    )
    
    const ministerials = processMinisterialResults(results)
    
    const ministerialsQuantity = await this.ministerialsRepo.findMinisterialsQuantity(filters)

    const response: FindAllResponse<any> = {
      data: ministerials,
      pagesQuantity: ministerialsQuantity
    }

    return response
  }
}
