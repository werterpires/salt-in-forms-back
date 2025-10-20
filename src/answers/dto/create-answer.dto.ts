
import { IsNotEmpty, IsString } from 'class-validator'

export class CreateAnswerDto {
  @IsNotEmpty()
  @IsString()
  accessCode: string

  @IsNotEmpty()
  questionId: number

  @IsNotEmpty()
  @IsString()
  answerValue: string

  @IsNotEmpty()
  validAnswer: boolean
}
