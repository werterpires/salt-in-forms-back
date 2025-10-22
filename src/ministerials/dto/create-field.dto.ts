import { Type } from 'class-transformer'
import { IsString, Length, ValidateNested } from 'class-validator'
import { CreateMinisterialDto } from './create-ministerial.dto'
import { Optional } from '@nestjs/common'

export class CreateFieldDto {
  @IsString({ message: '#O nome do campo deve ser uma string' })
  @Length(1, 255, {
    message: '#O nome do campo deve ter no mínimo 1 e no máximo 255 caracteres'
  })
  fieldName: string

  @IsString({ message: '#A sigla do campo deve ser uma string' })
  @Length(1, 20, {
    message: '#A sigla do campo deve ter no mínimo 1 e no máximo 20 caracteres'
  })
  fieldAcronym: string

  @Optional()
  @ValidateNested()
  @Type(() => CreateMinisterialDto)
  ministerial?: CreateMinisterialDto
}
