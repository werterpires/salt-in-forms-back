import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator'

export class UpdateCandidateDto {
  @IsNumber({}, { message: '#O ID do candidato deve ser um número' })
  @IsNotEmpty({ message: '#O ID do candidato é obrigatório' })
  candidateId: number

  @IsBoolean({ message: '#O campo approved deve ser verdadeiro ou falso' })
  @IsNotEmpty({ message: '#O campo approved é obrigatório' })
  approved: boolean
}
