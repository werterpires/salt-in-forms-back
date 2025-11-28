import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength
} from 'class-validator'

export class LogonDto {
  @IsString({
    message: '#O nome deve ter no mínimo 5 e no máximo 150 caracteres'
  })
  userName: string

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(16)
  @Matches(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+-={}|[\]:";'<>,.?/~`]).{8,}$/,
    {
      message:
        '#A senha deve possuir letras minúsculas, maiúsculas, numeros, caracteres especiais e ter de 8 a 16 caracteres.'
    }
  )
  userPassword: string

  @Length(11, 11, {
    message: '#O CPF deve ter 11 caracteres'
  })
  userCpf: string

  @IsArray({
    message: '#O array de roles deve ser um array'
  })
  @IsNumber(
    {},
    { each: true, message: '#Os IDs dos papéis de usuário devem ser numéricos' }
  )
  signedTerms: number[]
}
