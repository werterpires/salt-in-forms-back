import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  ParseIntPipe
} from '@nestjs/common'
import { MinisterialsService } from './ministerials.service'

import { CreateMinisterialsDto } from './dto/create-ministerials.dto'
import { UpdateMinisterialDto } from './dto/update-ministerial.dto'
import { Paginator } from 'src/shared/types/types'
import * as db from 'src/constants/db-schema.enum'
import { MinisterialsFilter } from './type'

@Controller('ministerials')
export class MinisterialsController {
  constructor(private readonly ministerialsService: MinisterialsService) {}

  @Post()
  create(@Body() createMinisterialsDto: CreateMinisterialsDto) {
    return this.ministerialsService.createMinisterials(createMinisterialsDto)
  }

  @Get()
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('direction') direction: string,
    @Query('column') column: string,
    @Query('ministerialName') ministerialName: string,
    @Query('fieldId') fieldId?: number,
    @Query('unionId') unionId?: number
  ) {
    const paginator = new Paginator<typeof db.Ministerials>(
      page,
      direction,
      column,
      db.Ministerials.MINISTERIAL_NAME,
      db.Ministerials
    )

    const filters: MinisterialsFilter = {
      ministerialName: ministerialName || undefined,
      fieldId: fieldId ? +fieldId : undefined,
      unionId: unionId ? +unionId : undefined
    }

    return this.ministerialsService.findAllMinisterials(paginator, filters)
  }

  @Put()
  update(@Body() updateMinisterialDto: UpdateMinisterialDto) {
    return this.ministerialsService.updateMinisterial(updateMinisterialDto)
  }
}
