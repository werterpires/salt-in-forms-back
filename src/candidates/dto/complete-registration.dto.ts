import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  Matches
} from 'class-validator'
import { Type } from 'class-transformer'

enum MaritalStatus {
  SOLTEIRO = 'solteiro',
  NAMORANDO = 'namorando',
  NOIVO = 'noivo',
  CASADO = 'casado',
  DIVORCIADO = 'divorciado',
  VIUVO = 'viúvo'
}

export class CompleteRegistrationDto {
  @IsString({ message: '#Data de nascimento deve ser uma string' })
  @IsNotEmpty({ message: '#Data de nascimento é obrigatória' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: '#Data de nascimento deve estar no formato YYYY-MM-DD'
  })
  candidateBirthdate: string

  @Type(() => Boolean)
  @IsBoolean({ message: '#Campo "É estrangeiro" deve ser verdadeiro ou falso' })
  @IsNotEmpty({ message: '#Campo "É estrangeiro" é obrigatório' })
  candidateForeigner: boolean

  @IsString({ message: '#Endereço deve ser uma string' })
  @IsNotEmpty({ message: '#Endereço é obrigatório' })
  @Length(3, 255, {
    message: '#Endereço deve ter entre 3 e 255 caracteres'
  })
  candidateAddress: string

  @IsString({ message: '#Número do endereço deve ser uma string' })
  @IsNotEmpty({ message: '#Número do endereço é obrigatório' })
  @Length(1, 20, {
    message: '#Número do endereço deve ter entre 1 e 20 caracteres'
  })
  candidateAddressNumber: string

  @IsString({ message: '#Bairro deve ser uma string' })
  @IsNotEmpty({ message: '#Bairro é obrigatório' })
  @Length(2, 100, {
    message: '#Bairro deve ter entre 2 e 100 caracteres'
  })
  candidateDistrict: string

  @IsString({ message: '#Cidade deve ser uma string' })
  @IsNotEmpty({ message: '#Cidade é obrigatória' })
  @Length(2, 100, {
    message: '#Cidade deve ter entre 2 e 100 caracteres'
  })
  candidateCity: string

  @IsString({ message: '#Estado deve ser uma string' })
  @IsNotEmpty({ message: '#Estado é obrigatório' })
  @Length(2, 100, {
    message: '#Estado deve ter entre 2 e 100 caracteres'
  })
  candidateState: string

  @IsString({ message: '#CEP deve ser uma string' })
  @IsNotEmpty({ message: '#CEP é obrigatório' })
  @Length(8, 10, {
    message: '#CEP deve ter entre 8 e 10 caracteres'
  })
  @Matches(/^[0-9-]+$/, {
    message: '#CEP deve conter apenas números e hífen'
  })
  candidateZipCode: string

  @IsString({ message: '#País deve ser uma string' })
  @IsNotEmpty({ message: '#País é obrigatório' })
  @Length(2, 100, {
    message: '#País deve ter entre 2 e 100 caracteres'
  })
  candidateCountry: string

  @IsEnum(MaritalStatus, {
    message:
      '#Estado civil deve ser: solteiro, namorando, noivo, casado, divorciado ou viúvo'
  })
  @IsNotEmpty({ message: '#Estado civil é obrigatório' })
  candidateMaritalStatus: MaritalStatus
}
