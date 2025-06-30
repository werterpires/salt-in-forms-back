import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Put,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
import { FormSectionsService } from './form-sections.service'
import { CreateFormSectionDto } from './dto/create-form-section.dto'
import { UpdateFormSectionDto } from './dto/update-form-section.dto'
import { ReorderFormSectionsDto } from './dto/reorder-form-sections.dto'
import { Roles } from 'src/users/decorators/roles.decorator'
import { ERoles } from 'src/constants/roles.const'

@Controller('form-sections')
export class FormSectionsController {
  constructor(private readonly formSectionsService: FormSectionsService) {}

  @Roles(ERoles.ADMIN)
  @Post()
  create(@Body() createFormSectionDto: CreateFormSectionDto) {
    return this.formSectionsService.create(createFormSectionDto)
  }

  @Roles(ERoles.ADMIN)
  @Get('by-form/:sFormId')
  findAllBySFormId(@Param('sFormId', ParseIntPipe) sFormId: number) {
    return this.formSectionsService.findAllBySFormId(sFormId)
  }

  @Roles(ERoles.ADMIN)
  @Put()
  update(@Body() updateFormSectionDto: UpdateFormSectionDto) {
    return this.formSectionsService.update(updateFormSectionDto)
  }

  @Roles(ERoles.ADMIN)
  //mudr o status code
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':formSectionId')
  remove(@Param('formSectionId', ParseIntPipe) formSectionId: number) {
    return this.formSectionsService.remove(formSectionId)
  }

  @Roles(ERoles.ADMIN)
  @Put('reorder')
  reorder(@Body() reorderFormSectionsDto: ReorderFormSectionsDto) {
    return this.formSectionsService.reorder(reorderFormSectionsDto)
  }
}
