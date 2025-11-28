import { IsArray, IsNumber, IsString, Length } from 'class-validator'

export class CreateUserDto {
  @IsString()
  @Length(5, 150, {
    message: '#O nome deve ter no mínimo 5 e no máximo 150 caracteres'
  })
  userName: string

  @IsString()
  @Length(5, 255, {
    message: '#O email deve ter no mínimo 5 e no máximo 255 caracteres'
  })
  userEmail: string

  @IsNumber(
    {},
    { each: true, message: '#Os IDs dos papéis de usuário devem ser numéricos' }
  )
  @IsArray({
    message: '#Os IDs dos papéis de usuário devem ser uma sequencia de números'
  })
  userRoles: number[]
}
