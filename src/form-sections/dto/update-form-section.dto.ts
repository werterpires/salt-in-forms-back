import { PartialType } from '@nestjs/mapped-types';
import { CreateFormSectionDto } from './create-form-section.dto';

export class UpdateFormSectionDto extends PartialType(CreateFormSectionDto) {}
