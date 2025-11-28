import { Length } from 'class-validator'

export class CreateQuestionsAreaDto {
  @Length(5, 45, {
    message: '#O nome da area deve ter no mínimo 5 e no máximo 45 caracteres'
  })
  questionAreaName: string

  @Length(5, 150, {
    message:
      '#A descricao da area deve ter no mínimo 5 e no máximo 150 caracteres'
  })
  questionAreaDescription: string
}
