import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Put
} from '@nestjs/common'
import { SFormsService } from './s-forms.service'
import { CreateSFormDto } from './dto/create-s-form.dto'
import { UpdateSFormDto } from './dto/update-s-form.dto'
import { CopySFormDto } from './dto/copy-s-form.dto'
import { Roles } from 'src/users/decorators/roles.decorator'
import { ERoles } from 'src/constants/roles.const'
import { Paginator } from 'src/shared/types/types'
import * as db from 'src/constants/db-schema.enum'
import { SFormFilter, SFormType } from './types'

@Controller('s-forms')
export class SFormsController {
  constructor(private readonly sFormsService: SFormsService) {}

  @Roles(ERoles.ADMIN)
  @Post()
  async create(@Body() createSFormDto: CreateSFormDto) {
    return await this.sFormsService.createSForm(createSFormDto)
  }

  @Roles(ERoles.ADMIN)
  @Get(':processId')
  async findAll(
    @Param('processId', ParseIntPipe) processId: number,
    @Query('direction') direction: string,
    @Query('page') page: number,
    @Query('column') column: string,
    @Query('sFormName') sFormName: string,
    @Query('sFormType') sFormType: string
  ) {
    const paginator = new Paginator<typeof db.SForms>(
      +page,
      direction,
      column,
      db.SForms.S_FORM_NAME,
      db.SForms
    )

    const filters: SFormFilter = {
      sFormName: sFormName || undefined,
      sFormType: (sFormType as SFormType) || undefined
    }

    return await this.sFormsService.findAllformsByProcessId(
      processId,
      paginator,
      filters
    )
  }

  @Roles(ERoles.ADMIN)
  @Get('form/:sFormId')
  async findOne(@Param('sFormId', ParseIntPipe) sFormId: number) {
    return await this.sFormsService.findSFormById(sFormId)
  }

  @Roles(ERoles.ADMIN)
  @Put()
  async update(@Body() updateSFormDto: UpdateSFormDto) {
    return await this.sFormsService.updateSForm(updateSFormDto)
  }

  @Roles(ERoles.ADMIN)
  @Delete(':sFormId')
  async remove(@Param('sFormId', ParseIntPipe) sFormId: number) {
    return await this.sFormsService.deleteSForm(sFormId)
  }

  @Roles(ERoles.ADMIN)
  @Post('copy')
  async copy(@Body() copySFormDto: CopySFormDto) {
    return await this.sFormsService.copySForm(copySFormDto)
  }
}
