import { IsNumber, IsOptional, Length } from 'class-validator'

export class QuestionOptionDto {
  @IsNumber({}, { message: '#O tipo da opção deve ser numérico.' })
  questionOptionType: number

  @Length(1, 255, {
    message: '#O valor da opção deve ter no mínimo 1 e no máximo 255 caracteres'
  })
  questionOptionValue: string

  @IsOptional()
  @IsNumber({}, { message: '#O ID da opção da pergunta deve ser numérico' })
  questionOptionId?: number

  @IsOptional()
  @IsNumber({}, { message: '#O ID da pergunta deve ser numérico.' })
  questionId?: number
}

export class SubQuestionOptionDto {
  @IsOptional()
  @IsNumber({}, { message: '#O ID da questão da pergunta deve ser numérico' })
  questionOptionId?: number

  @IsOptional()
  @IsNumber(
    {},
    { message: '#O ID da pergunta no optionsDto deve ser numérico.' }
  )
  questionId?: number

  @Length(1, 255, {
    message: '#O valor da opção deve ter no mínimo 1 e no máximo 255 caracteres'
  })
  questionOptionValue: string

  @IsNumber({}, { message: '#O tipo da opção deve ser numérico.' })
  questionOptionType: number
}
