import { IsNumber, IsString, MinLength } from 'class-validator'

export class CreateTermDto {
  @IsNumber({}, { message: '#O ID do papel de usuário deve ser numérico.' })
  roleId: number

  @IsNumber({}, { message: '#O ID do tipo de termos deve ser numérico.' })
  termTypeId: number

  @IsString({ message: '#Texto do termos de usuário inválido.' })
  @MinLength(100, {
    message: '#Texto do termo deve ter pelo menos 100 caracteres.'
  })
  termText: string

  @IsString({
    message:
      '#Data de inicio deve ser enviada como texto no formato YYYY-MM-DD.'
  })
  beginDate: string
}
