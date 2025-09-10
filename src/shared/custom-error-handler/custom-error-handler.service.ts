import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common'

export const defaultError =
  '#Erro interno. Informe o seguinte ID para o time de suporte: '

const conectError = 'connect ECONNREFUSED'

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

  handleErrors(error: Error, uniqueId: string): Error {
    if (error.message.startsWith('#')) {
      return error
    } else if ('code' in error) {
      const errCode = (error as any).code
      return this.handleKnexError(errCode, uniqueId)
    } else if (error.message.includes(conectError)) {
      return new InternalServerErrorException(
        '#Erro de conexão com o banco de dados. Informe o seguinte ID para o time de suporte: ' +
          uniqueId
      )
    } else if (error instanceof HttpException) {
      const response = error.getResponse()
      if (
        typeof response === 'object' &&
        'message' in response &&
        Array.isArray(response.message) &&
        response.message.length > 0 &&
        typeof response.message[0].startsWith('#')
      ) {
        return new BadRequestException(response.message[0])
      } else {
        if (
          typeof response === 'object' &&
          'message' in response &&
          response.message == 'Unauthorized'
        ) {
          return new BadRequestException(
            '#Seção expirada. Faca login para continuar.'
          )
        }
      }

      return error
    } else {
      return new InternalServerErrorException(defaultError + uniqueId)
    }
  }

  handleKnexError(code: string, uniqueId: string): Error {
    switch (code) {
      case 'ER_ROW_IS_REFERENCED_2':
        return new BadRequestException(
          '#Nãoé possível apagar este registro pois ele é referenciado em outro local.'
        )
      default:
        return new InternalServerErrorException(defaultError + uniqueId)
    }
  }
}
