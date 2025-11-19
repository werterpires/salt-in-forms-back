import { IsNumber } from 'class-validator'

export class AssignInterviewerDto {
  @IsNumber()
  userId: number

  @IsNumber()
  candidateId: number
}
