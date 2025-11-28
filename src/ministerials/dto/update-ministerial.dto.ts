import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator'

export class UpdateMinisterialDto {
  @IsInt({ message: '#O ID do ministerial deve ser um número inteiro' })
  ministerialId: number

  @IsString({ message: '#O nome do ministerial deve ser uma string' })
  ministerialName: string

  @IsOptional()
  @IsString({ message: '#O telefone principal deve ser uma string' })
  ministerialPrimaryPhone?: string | null

  @IsOptional()
  @IsString({ message: '#O telefone secundário deve ser uma string' })
  ministerialSecondaryPhone?: string | null

  @IsOptional()
  @IsString({ message: '#O telefone fixo deve ser uma string' })
  ministerialLandlinePhone?: string | null

  @IsOptional()
  @IsString({ message: '#O email principal deve ser uma string' })
  ministerialPrimaryEmail?: string | null

  @IsOptional()
  @IsString({ message: '#O email alternativo deve ser uma string' })
  ministerialAlternativeEmail?: string | null

  @IsOptional()
  @IsString({ message: '#O nome da secretaria deve ser uma string' })
  ministerialSecretaryName?: string | null

  @IsOptional()
  @IsString({ message: '#O telefone da secretaria deve ser uma string' })
  ministerialSecretaryPhone?: string | null

  @IsOptional()
  @IsBoolean({ message: '#O status ativo deve ser um booleano' })
  ministerialActive?: boolean | null
}
