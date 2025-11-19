import { IsNumber } from 'class-validator'

export class DistributeInterviewersDto {
  @IsNumber()
  processId: number
}
