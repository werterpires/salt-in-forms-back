
import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsString, Length, ValidateNested } from 'class-validator'
import { CreateMinisterialDto } from './create-ministerial.dto'

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

  @IsArray({ message: '#Os ministeriais devem ser um array' })
  @ArrayMinSize(1, { message: '#Ao menos um ministerial deve ser informado' })
  @ValidateNested({ each: true })
  @Type(() => CreateMinisterialDto)
  ministerials: CreateMinisterialDto[]
}
