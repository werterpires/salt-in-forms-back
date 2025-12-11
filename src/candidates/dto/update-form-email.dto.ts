import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator'

export class UpdateFormEmailDto {
  @IsNumber({}, { message: '#O ID do formulário deve ser um número' })
  @IsNotEmpty({ message: '#O ID do formulário é obrigatório' })
  formId: number

  @IsNumber({}, { message: '#O ID do candidato deve ser um número' })
  @IsNotEmpty({ message: '#O ID do candidato é obrigatório' })
  candidateId: number

  @IsEmail({}, { message: '#O email fornecido não é válido' })
  @IsNotEmpty({ message: '#O novo email é obrigatório' })
  newEmail: string
}
