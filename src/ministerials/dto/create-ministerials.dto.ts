import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator'
import { CreateUnionDto } from './create-union.dto'

export class CreateMinisterialsDto {
  @IsArray({ message: '#As uniões devem ser um array' })
  @ArrayMinSize(1, { message: '#Ao menos uma união deve ser informada' })
  @ValidateNested({ each: true })
  @Type(() => CreateUnionDto)
  unions: CreateUnionDto[]
}
