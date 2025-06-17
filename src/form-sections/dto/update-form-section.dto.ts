
import { IsNumber, IsOptional, Length, Min } from 'class-validator'

export class UpdateFormSectionDto {
  @IsNumber({}, { message: '#O ID da seção deve ser numérico.' })
  formSectionId: number

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
  @IsNumber({}, { message: '#O link de exibição deve ser numérico.' })
  formSectionDisplayLink?: number
}
