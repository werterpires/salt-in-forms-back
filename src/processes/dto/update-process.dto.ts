import { IsNumber } from 'class-validator'
import { CreateProcessDto } from './create-process.dto'

export class UpdateProcessDto extends CreateProcessDto {
  @IsNumber({}, { message: '#O ID do processo deve ser numérico.' })
  processId: number
}
