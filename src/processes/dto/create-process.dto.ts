import { IsNumber, IsOptional, Length, Min } from 'class-validator'

export class CreateProcessDto {
  @Length(5, 150, {
    message:
      '#O título do vestibular deve ter no mínimo 5 e no máximo 150 caracteres'
  })
  processTitle: string

  @Length(5, 250, {
    message:
      '#O identificador do tenant (data key) deve ter no mínimo 5 e no máximo 250 caracteres'
  })
  processDataKey: string

  @Length(10, 10, {
    message: "#A data de início do processo deve ter o formato 'YYYY-MM-DD'"
  })
  processBeginDate: string

  @Length(10, 10, {
    message: "#A data de fim do processo deve ter o formato 'YYYY-MM-DD'"
  })
  processEndDate: string

  @Length(10, 10, {
    message:
      "#A data de fim para respostas do processo deve ter o formato 'YYYY-MM-DD'"
  })
  processEndAnswers: string

  @Length(10, 10, {
    message:
      "#A data de fim para inscrições do processo deve ter o formato 'YYYY-MM-DD'"
  })
  processEndSubscription: string

  @IsOptional()
  @IsNumber(
    {},
    {
      message: '#A pontuação de corte deve ser numérica.'
    }
  )
  @Min(0, {
    message: '#A pontuação de corte deve ser maior ou igual a 0.'
  })
  cutoffScore?: number
}
