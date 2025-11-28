import { IsNumber, Length } from 'class-validator'

export class CopySFormDto {
  @IsNumber(
    {},
    { message: '#O ID do formulário a ser copiado deve ser numérico.' }
  )
  sourceSFormId: number

  @IsNumber({}, { message: '#O ID do processo de destino deve ser numérico.' })
  targetFormId: number
}
