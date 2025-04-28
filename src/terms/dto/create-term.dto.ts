import { IsNumber, IsString } from 'class-validator'

export class CreateTermDto {
  @IsNumber({}, { message: '#O ID do papel de usuário deve ser numérico.' })
  roleId: number

  @IsNumber({}, { message: '#O ID do tipo de termos deve ser numérico.' })
  termTypeId: number

  @IsString({ message: '#Texto do termos de usuário inválido.' })
  termText: string

  @IsString({
    message:
      '#Data de inicio deve ser enviada como texto no formato YYYY-MM-DD.'
  })
  beginDate: string
}
