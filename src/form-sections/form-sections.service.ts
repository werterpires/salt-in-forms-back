import { Injectable } from '@nestjs/common';
import { CreateFormSectionDto } from './dto/create-form-section.dto';
import { UpdateFormSectionDto } from './dto/update-form-section.dto';

@Injectable()
export class FormSectionsService {
  create(createFormSectionDto: CreateFormSectionDto) {
    return 'This action adds a new formSection';
  }

  findAll() {
    return `This action returns all formSections`;
  }

  findOne(id: number) {
    return `This action returns a #${id} formSection`;
  }

  update(id: number, updateFormSectionDto: UpdateFormSectionDto) {
    return `This action updates a #${id} formSection`;
  }

  remove(id: number) {
    return `This action removes a #${id} formSection`;
  }
}
