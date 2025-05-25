import { IsNumber, Length } from 'class-validator'

export class UpdateSFormDto {
  @Length(5, 150, {
    message:
      '#O título do formulário deve ter no mínimo 5 e no máximo 150 caracteres'
  })
  sFormName: string

  @Length(5, 50, {
    message:
      '#O tipo do formulário deve ter no mínimo 5 e no máximo 50 caracteres'
  })
  sFormType: string

  @IsNumber({}, { message: '#O ID do formulário deve ser numérico.' })
  sFormId: number
}
