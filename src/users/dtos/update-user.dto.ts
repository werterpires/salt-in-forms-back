import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumber,
  IsString,
  Length
} from 'class-validator'

export class UpdateUserDto {
  @IsNumber({}, { message: '#O ID do usuário deve ser numérico.' })
  userId: number

  @IsString()
  @IsEmail({}, { message: '#O email enviado não é um email válido.' })
  @Length(5, 255, {
    message: '#O email deve ter no mínimo 5 e no máximo 255 caracteres'
  })
  userEmail: string

  @IsBoolean()
  userActive: boolean

  @IsString()
  @Length(5, 150, {
    message: '#O nome deve ter no mínimo 5 e no máximo 150 caracteres'
  })
  userName: string

  @IsNumber(
    {},
    { each: true, message: '#Os IDs dos papéis de usuário devem ser numéricos' }
  )
  @IsArray({
    message: '#Os IDs dos papéis de usuário devem ser uma sequencia de números'
  })
  userRoles: number[]
}
