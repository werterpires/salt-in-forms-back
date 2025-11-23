import { IsNotEmpty, IsString } from 'class-validator'

export class UpdateAnswerCommentDto {
  @IsString()
  @IsNotEmpty()
  answerComment: string
}
