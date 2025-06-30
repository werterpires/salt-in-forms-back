
import { IsArray, IsNumber, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class QuestionOrderDto {
  @IsNumber({}, { message: '#O ID da pergunta deve ser numérico.' })
  questionId: number

  @IsNumber({}, { message: '#A ordem da pergunta deve ser numérica.' })
  questionOrder: number
}

export class ReorderQuestionsDto {
  @IsArray({ message: '#Deve ser um array de perguntas.' })
  @ValidateNested({ each: true })
  @Type(() => QuestionOrderDto)
  questions: QuestionOrderDto[]
}
