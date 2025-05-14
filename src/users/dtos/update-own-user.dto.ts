import { IsEmail, IsString, Length } from 'class-validator'

export class UpdateOwnUserDto {
  @IsString()
  @IsEmail({}, { message: '#O email enviado não é um email válido.' })
  @Length(5, 255, {
    message: '#O email deve ter no mínimo 5 e no máximo 255 caracteres'
  })
  userEmail: string
}
