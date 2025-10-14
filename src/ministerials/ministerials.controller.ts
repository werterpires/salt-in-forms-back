import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe
} from '@nestjs/common'
import { MinisterialsService } from './ministerials.service'

import { CreateMinisterialsDto } from './dto/create-ministerials.dto'
import { Paginator } from 'src/shared/types/types'
import * as db from 'src/constants/db-schema.enum'
import { BoolenOrUndefinedPipe } from 'src/shared/pipes/boolen-or-undefined/boolen-or-undefined.pipe'
import { MinisterialsFiltar } from './type'

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
    @Query('ministerialField') ministerialField: string,
    @Query('ministerialActive', BoolenOrUndefinedPipe)
    ministerialActive: boolean,
    @Query('ministerialName') ministerialName: string
  ) {
    const paginator = new Paginator<typeof db.Ministerials>(
      page,
      direction,
      column,
      db.Ministerials.MINISTERIAL_FIELD,
      db.Ministerials
    )

    const filters: MinisterialsFiltar = {
      ministerialField,
      ministerialActive,
      ministerialName
    }

    return this.ministerialsService.findAllMinisterials(paginator, filters)
  }
}