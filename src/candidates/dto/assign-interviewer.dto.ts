import { IsInt, IsPositive } from 'class-validator'

export class AssignInterviewerDto {
  @IsInt({ message: 'userId deve ser um número inteiro' })
  @IsPositive({ message: 'userId deve ser um número positivo' })
  userId: number

  @IsInt({ message: 'candidateId deve ser um número inteiro' })
  @IsPositive({ message: 'candidateId deve ser um número positivo' })
  candidateId: number
}
