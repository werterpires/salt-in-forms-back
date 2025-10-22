
import { IsOptional, IsString, Length } from 'class-validator'

export class CreateMinisterialDto {
  @IsString({ message: '#O nome do ministerial deve ser uma string' })
  @Length(1, 255, {
    message: '#O nome do ministerial deve ter no mínimo 1 e no máximo 255 caracteres'
  })
  ministerialName: string

  @IsOptional()
  @IsString({ message: '#O telefone principal deve ser uma string' })
  ministerialPrimaryPhone?: string

  @IsOptional()
  @IsString({ message: '#O telefone secundário deve ser uma string' })
  ministerialSecondaryPhone?: string

  @IsOptional()
  @IsString({ message: '#O telefone fixo deve ser uma string' })
  ministerialLandlinePhone?: string

  @IsOptional()
  @IsString({ message: '#O email principal deve ser uma string' })
  ministerialPrimaryEmail?: string

  @IsOptional()
  @IsString({ message: '#O email alternativo deve ser uma string' })
  ministerialAlternativeEmail?: string

  @IsOptional()
  @IsString({ message: '#O nome da secretaria deve ser uma string' })
  ministerialSecretaryName?: string

  @IsOptional()
  @IsString({ message: '#O telefone da secretaria deve ser uma string' })
  ministerialSecretaryPhone?: string
}
