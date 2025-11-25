import { IsEmail, IsNotEmpty } from 'class-validator'

export class ForgotPasswordDto {
  @IsEmail(
    {},
    {
      message: '#O email enviado não é um email válido.'
    }
  )
  @IsNotEmpty({
    message: '#O email deve ser informado.'
  })
  userEmail: string
}
