import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength
} from 'class-validator'

export class ResetPasswordDto {
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

  @IsNotEmpty({
    message: '#O código de verificação deve ser informado.'
  })
  @MinLength(6)
  @MaxLength(6)
  code: string

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(16)
  @Matches(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+-={}|[\]:";'<>,.?/~`]).{8,}$/,
    {
      message:
        '#A nova senha deve possuir letras minúsculas, maiúsculas, numeros, caracteres especiais e ter de 8 a 16 caracteres.'
    }
  )
  newPassword: string
}
