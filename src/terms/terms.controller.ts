import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
  ParseIntPipe
} from '@nestjs/common'
import { TermsService } from './terms.service'
import { CreateTermDto } from './dto/create-term.dto'
import { UpdateTermDto } from './dto/update-term.dto'
import { TermFilter } from './types'
import * as db from 'src/constants/db-schema.enum'
import { Roles } from 'src/users/decorators/roles.decorator'
import { ERoles } from 'src/constants/roles.const'
import { Paginator } from 'src/shared/types/types'
import { BoolenOrUndefinedPipe } from 'src/shared/pipes/boolen-or-undefined/boolen-or-undefined.pipe'

@Controller('terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Roles(ERoles.ADMIN)
  @Post()
  async createTerm(@Body() createTermDto: CreateTermDto): Promise<void> {
    return await this.termsService.createTerm(createTermDto)
  }

  @Roles(ERoles.ADMIN)
  @Get()
  findAll(
    @Query('direction') direction: string,
    @Query('page') page: string,
    @Query('column') column: string,
    @Query('roleId') roleId: string,
    @Query('termTypeId') termTypeId: string,
    @Query('onlyActive', BoolenOrUndefinedPipe) onlyActive: boolean
  ) {
    const paginator = new Paginator<typeof db.Terms>(
      +page,
      direction,
      column,
      db.Terms.BEGIN_DATE,
      db.Terms
    )

    const filters: TermFilter = {
      roleId: +roleId || undefined,
      termTypeId: +termTypeId || undefined,
      onlyActive: onlyActive || undefined
    }

    return this.termsService.findAllTerms(paginator, filters)
  }

  @Roles(ERoles.ADMIN)
  @Put()
  update(@Body() updateTermDto: UpdateTermDto) {
    return this.termsService.updateTerm(updateTermDto)
  }

  @Roles(ERoles.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.termsService.deleteTerm(id)
  }
}
