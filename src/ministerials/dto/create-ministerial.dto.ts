import { Length } from 'class-validator'

export class CreateMinisterialDto {
  @Length(5, 150, {
    message:
      '#O nome do ministerial deve ter no mínimo 5 e no máximo 150 caracteres'
  })
  ministerialName: string

  @Length(2, 150, {
    message:
      '#O campo do ministerial deve ter no mínimo 2 e no máximo 150 caracteres'
  })
  ministerialField: string

  @Length(5, 150, {
    message:
      '#O email do ministerial deve ter no mínimo 5 e no máximo 150 caracteres'
  })
  ministerialEmail: string
}
