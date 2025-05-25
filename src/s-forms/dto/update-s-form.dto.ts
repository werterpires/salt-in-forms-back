import { CreateSFormDto } from './create-s-form.dto'
import { IsNumber } from 'class-validator'

export class UpdateSFormDto extends CreateSFormDto {
  @IsNumber({}, { message: '#O ID do formulário deve ser numérico.' })
  sFormId: number
}
