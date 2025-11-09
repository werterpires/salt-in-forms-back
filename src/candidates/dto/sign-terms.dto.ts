import { IsArray, IsNumber } from 'class-validator'

export class SignTermsDto {
  @IsArray({ message: '#Os IDs dos termos devem ser um array.' })
  @IsNumber({}, { each: true, message: '#Cada ID de termo deve ser numérico.' })
  termIds: number[]
}
