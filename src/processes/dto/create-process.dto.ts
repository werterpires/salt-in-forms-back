import { IsOptional, Length } from 'class-validator'

export class CreateProcessDto {
  @Length(5, 150, {
    message:
      '#O título do vestibular deve ter no mínimo 5 e no máximo 150 caracteres'
  })
  processTitle: string

  @Length(5, 250, {
    message:
      '#O id do processo de vestibular no totvs deve ter no mínimo 5 e no máximo 250 caracteres'
  })
  processTotvsId: string

  @Length(10, 10, {
    message: "#A data de início do processo deve ter o formato 'YYYY-MM-DD'"
  })
  processBeginDate: string

  @Length(10, 10, {
    message: "#A data de fim do processo deve ter o formato 'YYYY-MM-DD'"
  })
  processEndDate: string


  @Length(10, 10, {
    message: "#A data de fim para respostas do processo deve ter o formato 'YYYY-MM-DD'"
  })
  @IsOptional()
  processEndAnswers: string

  @Length(10, 10, {
    message: "#A data de fim para inscrições do processo deve ter o formato 'YYYY-MM-DD'"
  })
  @IsOptional()
  processEndSubscription: string
}
