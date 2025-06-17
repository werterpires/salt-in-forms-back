import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FormSectionsService } from './form-sections.service';
import { CreateFormSectionDto } from './dto/create-form-section.dto';
import { UpdateFormSectionDto } from './dto/update-form-section.dto';

@Controller('form-sections')
export class FormSectionsController {
  constructor(private readonly formSectionsService: FormSectionsService) {}

  @Post()
  create(@Body() createFormSectionDto: CreateFormSectionDto) {
    return this.formSectionsService.create(createFormSectionDto);
  }

  @Get()
  findAll() {
    return this.formSectionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formSectionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFormSectionDto: UpdateFormSectionDto) {
    return this.formSectionsService.update(+id, updateFormSectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formSectionsService.remove(+id);
  }
}
