import { Controller, Get } from '@nestjs/common'
import { FieldsService } from './fields.service'
import { IsPublic } from 'src/shared/auth/decorators/is-public.decorator'

@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @IsPublic()
  @Get('unions')
  async findAllUnions() {
    return await this.fieldsService.findAllUnions()
  }
}
