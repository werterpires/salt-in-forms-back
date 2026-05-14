import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common'
import { FieldsService } from './fields.service'
import { IsPublic } from 'src/shared/auth/decorators/is-public.decorator'
import { Paginator } from 'src/shared/types/types'
import * as db from 'src/constants/db-schema.enum'
import { FieldsWithMinisterialsFilter } from './type'

@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @IsPublic()
  @Get('unions')
  async findAllUnions() {
    return await this.fieldsService.findAllUnions()
  }

  @Get('with-ministerials')
  findAllWithMinisterials(
    @Query('page', ParseIntPipe) page: number,
    @Query('direction') direction: string,
    @Query('column') column: string,
    @Query('fieldName') fieldName?: string,
    @Query('unionId') unionId?: number
  ) {
    const paginator = new Paginator<typeof db.Fields>(
      page,
      direction,
      column,
      db.Fields.FIELD_NAME,
      db.Fields
    )

    const filters: FieldsWithMinisterialsFilter = {
      fieldName: fieldName || undefined,
      unionId: unionId ? +unionId : undefined
    }

    return this.fieldsService.findAllFieldsWithMinisterials(paginator, filters)
  }
}
