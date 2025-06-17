
import { IsArray, IsNumber, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class FormSectionOrderDto {
  @IsNumber({}, { message: '#O ID da seção deve ser numérico.' })
  formSectionId: number

  @IsNumber({}, { message: '#A ordem da seção deve ser numérica.' })
  formSectionOrder: number
}

export class ReorderFormSectionsDto {
  @IsArray({ message: '#Deve ser um array de seções.' })
  @ValidateNested({ each: true })
  @Type(() => FormSectionOrderDto)
  sections: FormSectionOrderDto[]
}
