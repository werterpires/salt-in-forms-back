import { Injectable } from '@nestjs/common'
import { CreateMinisterialsDto } from './dto/create-ministerials.dto'
import { CreateMinisterial, Ministerial, MinisterialsFiltar } from './type'
import { MinisterialsRepo } from './ministerials.repo'
import * as db from 'src/constants/db-schema.enum'
import { FindAllResponse, Paginator } from 'src/shared/types/types'

@Injectable()
export class MinisterialsService {
  constructor(private readonly ministerialsRepo: MinisterialsRepo) {}
  async mergeMinisterials(createMinisterialsDto: CreateMinisterialsDto) {
    const ministerials: CreateMinisterial[] =
      createMinisterialsDto.ministerials.map((m) => {
        return {
          ministerialName: m.ministerialName,
          ministerialField: m.ministerialField,
          ministerialEmail: m.ministerialEmail
        }
      })

    await this.ministerialsRepo.mergeMinisterials(ministerials)
  }

  async findAllMinisterials(
    orderBy: Paginator<typeof db.Ministerials>,
    filters: MinisterialsFiltar
  ): Promise<FindAllResponse<Ministerial>> {
    const ministerials = await this.ministerialsRepo.findAllMinisterials(
      orderBy,
      filters
    )

    const ministerialsQuantity =
      await this.ministerialsRepo.findMinisterialsQuantity(filters)

    const ministerialsResponse: FindAllResponse<Ministerial> = {
      data: ministerials,
      pagesQuantity: ministerialsQuantity
    }

    return ministerialsResponse
  }
}
