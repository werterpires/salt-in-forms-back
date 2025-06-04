import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator'
import { CreateMinisterialDto } from './create-ministerial.dto'

export class CreateMinisterialsDto {
  @IsArray()
  @ArrayMinSize(1, { message: '#Ao menos um ministerial deve ser informado' })
  @ValidateNested({ each: true })
  @Type(() => CreateMinisterialDto)
  ministerials: CreateMinisterialDto[]
}
