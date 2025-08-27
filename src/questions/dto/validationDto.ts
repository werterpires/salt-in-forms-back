import { IsNumber, IsOptional } from 'class-validator'

export class ValidationDto {
  @IsNumber({}, { message: '#O tipo da validação deve ser numérico.' })
  validationType!: number

  @IsOptional()
  valueOne?: any

  @IsOptional()
  valueTwo?: any

  @IsOptional()
  valueThree?: any

  @IsOptional()
  valueFour?: any
}

export class SubValidationDto {
  @IsNumber({}, { message: '#O tipo da validação deve ser numérico.' })
  subValidationType!: number

  @IsOptional()
  subValueOne?: any

  @IsOptional()
  subValueTwo?: any

  @IsOptional()
  subValueThree?: any

  @IsOptional()
  subValueFour?: any
}
