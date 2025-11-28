import { IsNumber } from 'class-validator'
import { CreateTermDto } from './create-term.dto'

export class UpdateTermDto extends CreateTermDto {
  @IsNumber({}, { message: '#O ID do termo deve ser numérico.' })
  termId: number
}
