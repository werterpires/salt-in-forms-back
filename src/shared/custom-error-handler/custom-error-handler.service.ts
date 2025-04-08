import { Injectable, InternalServerErrorException } from '@nestjs/common'

export const defaultError =
  '#Erro interno. Informe o time de suporte para correção.'

@Injectable()
export class CustomErrorHandlerService {
  constructor() {}

  internalErrors = [
    'ERR_ASSERTION',
    'ER_BAD_FIELD_ERROR',
    'ER_NO_DEFAULT_FOR_FIELD',
    'ER_NO_SUCH_TABLE',
    'ER_NON_UNIQ_ERROR'
  ]

  handleErrors(error: Error): Error {
    if (error.message.startsWith('#')) {
      return error
    } else {
      return new InternalServerErrorException(defaultError)
    }
  }
}
