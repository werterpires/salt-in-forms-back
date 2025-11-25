import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length
} from 'class-validator'

export class Verify2FADto {
  @IsEmail(
    {},
    {
      message: '#O email enviado não é um email válido.'
    }
  )
  userEmail: string

  @IsNotEmpty({
    message: '#O código de verificação deve ser informado.'
  })
  @IsString({
    message: '#O código de verificação deve ser uma string.'
  })
  @Length(6, 6, {
    message: '#O código de verificação deve ter 6 caracteres.'
  })
  code: string

  @IsOptional()
  @IsNumber({}, { each: true })
  termsIds?: number[]
}
