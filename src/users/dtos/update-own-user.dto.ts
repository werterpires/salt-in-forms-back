import { IsEmail, IsNumber, IsString, Length } from 'class-validator'

export class UpdateOwnUserDto {
  @IsNumber({}, { message: '#O ID do usuário deve ser numérico.' })
  userId: number

  @IsString()
  @IsEmail({}, { message: '#O email enviado não é um email válido.' })
  @Length(5, 255, {
    message: '#O email deve ter no mínimo 5 e no máximo 255 caracteres'
  })
  userEmail: string

  @IsString()
  @Length(5, 150, {
    message: '#O nome deve ter no mínimo 5 e no máximo 150 caracteres'
  })
  userName: string

  @Length(11, 11, {
    message: '#O CPF deve ter 11 caracteres'
  })
  userCpf: string
}
