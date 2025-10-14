import { IsNumber, IsOptional, Length } from 'class-validator'

export class CreateSFormDto {
  @Length(5, 150, {
    message:
      '#O título do formulário deve ter no mínimo 5 e no máximo 150 caracteres'
  })
  sFormName: string

  @Length(5, 50, {
    message:
      '#O tipo do formulário deve ter no mínimo 5 e no máximo 50 caracteres'
  })
  sFormType: string

  @IsNumber({}, { message: '#O ID do processo deve ser numérico.' })
  processId: number

  @IsOptional()
  @IsNumber({}, { message: '#O ID da questão de email deve ser numérico.' })
  emailQuestionId?: number
}
