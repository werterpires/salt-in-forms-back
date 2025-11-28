import { IsNumber, IsOptional, IsString, Length, Min } from 'class-validator'

export class CreateFormSectionDto {
  @IsNumber({}, { message: '#O ID do formulário deve ser numérico.' })
  sFormId: number

  @Length(3, 150, {
    message: '#O nome da seção deve ter no mínimo 3 e no máximo 150 caracteres'
  })
  formSectionName: string

  @IsNumber({}, { message: '#A ordem da seção deve ser numérica.' })
  @Min(1, { message: '#A ordem da seção deve ser maior que 0.' })
  formSectionOrder: number

  @IsNumber({}, { message: '#A regra de exibição deve ser numérica.' })
  formSectionDisplayRule: number

  @IsOptional()
  @IsNumber(
    {},
    { message: '#O link de seção da regra de exibição deve ser numérico.' }
  )
  formSectionDisplayLink?: number

  @IsOptional()
  @IsNumber({}, { message: '#O link da seção deve ser numérico.' })
  questionDisplayLink?: number

  @IsOptional()
  @IsNumber(
    {},
    { message: '#A regra de exibição da resposta deve ser numérica.' }
  )
  answerDisplayRule?: number

  @IsOptional()
  @IsString({ each: true, message: '#Cada valor de exibição da resposta deve ser uma string.' })
  answerDisplayValue?: string[]
}
