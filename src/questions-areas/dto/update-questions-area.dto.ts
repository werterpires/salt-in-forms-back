import { IsBoolean, IsNumber } from 'class-validator'
import { CreateQuestionsAreaDto } from './create-questions-area.dto'

export class UpdateQuestionsAreaDto extends CreateQuestionsAreaDto {
  @IsNumber({}, { message: '#O ID da area deve ser numérico.' })
  questionAreaId: number

  @IsBoolean({ message: '#A area deve estar ativa (true) ou inativa (false).' })
  questionAreaActive: boolean
}
