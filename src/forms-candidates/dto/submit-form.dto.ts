import { IsString, IsNotEmpty } from 'class-validator'

export class SubmitFormDto {
  @IsString()
  @IsNotEmpty()
  accessCode: string
}
