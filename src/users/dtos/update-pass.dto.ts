import { IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator'

export class UpdatePasswordDto {
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(16)
  @Matches(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+-={}|[\]:";'<>,.?/~`]).{8,}$/,
    {
      message:
        '#A senha antiga deve possuir letras minúsculas, maiúsculas, numeros, caracteres especiais e ter de 8 a 16 caracteres.'
    }
  )
  oldPassword: string

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
