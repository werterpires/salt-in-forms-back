import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Matches
} from 'class-validator'
import { Type } from 'class-transformer'
import { DocumentType } from '../types'

export class SelfRegisterCandidateDto {
  @IsString({ message: '#Nome do candidato deve ser uma string' })
  @IsNotEmpty({ message: '#Nome do candidato é obrigatório' })
  @Length(3, 200, {
    message: '#Nome do candidato deve ter entre 3 e 200 caracteres'
  })
  candidateName: string

  @IsEmail({}, { message: '#Email inválido' })
  @IsNotEmpty({ message: '#Email é obrigatório' })
  candidateEmail: string

  @IsEnum(['CPF', 'PASSPORT', 'OTHER'], {
    message: '#Tipo de documento inválido. Deve ser: CPF, PASSPORT ou OTHER'
  })
  @IsNotEmpty({ message: '#Tipo de documento é obrigatório' })
  candidateDocumentType: DocumentType

  @IsString({ message: '#Documento deve ser uma string' })
  @IsNotEmpty({ message: '#Documento é obrigatório' })
  @Length(3, 50, {
    message: '#Documento deve ter entre 3 e 50 caracteres'
  })
  candidateUniqueDocument: string

  @IsString({ message: '#Telefone deve ser uma string' })
  @IsNotEmpty({ message: '#Telefone é obrigatório' })
  @Length(10, 20, {
    message: '#Telefone deve ter entre 10 e 20 caracteres'
  })
  @Matches(/^[0-9+\-() ]+$/, {
    message:
      '#Telefone deve conter apenas números e caracteres: +, -, (, ), espaço'
  })
  candidatePhone: string

  @Type(() => Number)
  @IsInt({ message: '#ID do processo deve ser um número inteiro' })
  @IsNotEmpty({ message: '#ID do processo é obrigatório' })
  processId: number

  @IsString({ message: '#Código do pedido deve ser uma string' })
  @IsNotEmpty({ message: '#Código do pedido é obrigatório' })
  @Length(1, 50, {
    message: '#Código do pedido deve ter entre 1 e 50 caracteres'
  })
  orderCode: string
}
