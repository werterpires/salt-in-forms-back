import { IsNotEmpty, IsString, Length } from 'class-validator'

export class ResendConfirmationDto {
  @IsString({ message: '#Código do pedido deve ser uma string' })
  @IsNotEmpty({ message: '#Código do pedido é obrigatório' })
  @Length(1, 50, {
    message: '#Código do pedido deve ter entre 1 e 50 caracteres'
  })
  orderCode: string
}
