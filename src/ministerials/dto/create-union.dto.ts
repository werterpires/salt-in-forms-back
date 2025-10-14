
import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsString, Length, ValidateNested } from 'class-validator'
import { CreateFieldDto } from './create-field.dto'

export class CreateUnionDto {
  @IsString({ message: '#O nome da união deve ser uma string' })
  @Length(1, 255, {
    message: '#O nome da união deve ter no mínimo 1 e no máximo 255 caracteres'
  })
  unionName: string

  @IsString({ message: '#A sigla da união deve ser uma string' })
  @Length(1, 20, {
    message: '#A sigla da união deve ter no mínimo 1 e no máximo 20 caracteres'
  })
  unionAcronym: string

  @IsArray({ message: '#Os campos devem ser um array' })
  @ArrayMinSize(1, { message: '#Ao menos um campo deve ser informado' })
  @ValidateNested({ each: true })
  @Type(() => CreateFieldDto)
  fields: CreateFieldDto[]
}
