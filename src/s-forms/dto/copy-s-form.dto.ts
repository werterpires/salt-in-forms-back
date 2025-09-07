import { IsNumber, Length } from 'class-validator'

export class CopySFormDto {
  @IsNumber({}, { message: '#O ID do formulário a ser copiado deve ser numérico.' })
  sourceSFormId: number

  @IsNumber({}, { message: '#O ID do processo de destino deve ser numérico.' })
  targetProcessId: number

  @Length(5, 150, {
    message:
      '#O nome do novo formulário deve ter no mínimo 5 e no máximo 150 caracteres'
  })
  newSFormName: string
}