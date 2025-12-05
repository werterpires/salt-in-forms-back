import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator'

export class UpdateRateDto {
  @IsInt({
    message: '#O ID do rate deve ser um número inteiro'
  })
  @Min(1, {
    message: '#O ID do rate deve ser maior que 0'
  })
  rateId: number

  @IsOptional()
  @IsInt({
    message: '#A nota deve ser um número inteiro'
  })
  @Min(0, {
    message: '#A nota deve ser maior ou igual a 0'
  })
  @Max(999, {
    message: '#A nota deve ser menor ou igual a 999'
  })
  rateValue?: number

  @IsOptional()
  @IsString({
    message: '#O comentário deve ser uma string'
  })
  rateComment?: string
}
