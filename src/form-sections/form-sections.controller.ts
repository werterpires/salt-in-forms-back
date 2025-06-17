
import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common'
import { FormSectionsService } from './form-sections.service'
import { CreateFormSectionDto } from './dto/create-form-section.dto'
import { UpdateFormSectionDto } from './dto/update-form-section.dto'

@Controller('form-sections')
export class FormSectionsController {
  constructor(private readonly formSectionsService: FormSectionsService) {}

  @Post()
  create(@Body() createFormSectionDto: CreateFormSectionDto) {
    return this.formSectionsService.create(createFormSectionDto)
  }

  @Get('by-form/:sFormId')
  findAllBySFormId(@Param('sFormId', ParseIntPipe) sFormId: number) {
    return this.formSectionsService.findAllBySFormId(sFormId)
  }

  @Patch()
  update(@Body() updateFormSectionDto: UpdateFormSectionDto) {
    return this.formSectionsService.update(updateFormSectionDto)
  }

  @Delete(':formSectionId')
  remove(@Param('formSectionId', ParseIntPipe) formSectionId: number) {
    return this.formSectionsService.remove(formSectionId)
  }
}
