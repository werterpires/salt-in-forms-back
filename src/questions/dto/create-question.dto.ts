import {
  IsNumber,
  IsOptional,
  Length,
  Min,
  IsArray,
  IsString
} from 'class-validator'

export class CreateQuestionDto {
  @IsNumber({}, { message: '#O ID da seção deve ser numérico.' })
  formSectionId: number

  @IsNumber({}, { message: '#O ID da área da pergunta deve ser numérico.' })
  questionAreaId: number

  @IsNumber({}, { message: '#A ordem da pergunta deve ser numérica.' })
  @Min(1, { message: '#A ordem da pergunta deve ser maior que 0.' })
  questionOrder: number

  @IsNumber({}, { message: '#O tipo da pergunta deve ser numérico.' })
  questionType: number

  @Length(3, 255, {
    message:
      '#O enunciado da pergunta deve ter no mínimo 3 e no máximo 255 caracteres'
  })
  questionStatement: string

  @Length(3, 255, {
    message:
      '#A descrição da pergunta deve ter no mínimo 3 e no máximo 255 caracteres'
  })
  questionDescription: string

  @IsNumber({}, { message: '#A regra de exibição deve ser numérica.' })
  questionDisplayRule: number

  @IsOptional()
  @IsNumber({}, { message: '#O link da seção deve ser numérico.' })
  formSectionDisplayLink?: number

  @IsOptional()
  @IsNumber({}, { message: '#O link da pergunta deve ser numérico.' })
  questionDisplayLink?: number

  @IsOptional()
  @IsNumber(
    {},
    { message: '#A regra de exibição da resposta deve ser numérica.' }
  )
  answerDisplayRule?: number

  @IsOptional()
  @IsArray({ message: '#O valor de exibição da resposta deve ser um array.' })
  @IsString({ each: true, message: '#Cada valor deve ser uma string.' })
  answerDisplayValue?: string[]
}
