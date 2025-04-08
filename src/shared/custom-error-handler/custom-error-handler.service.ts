import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { CustomLoggerService } from '../utils-module/custom-logger/custom-logger.service'

@Injectable()
export class CustomErrorHandlerService {
  constructor(private readonly logger: CustomLoggerService) {
    this.logger.setContext(CustomErrorHandlerService.name)
  }

  internalErrors = [
    'ERR_ASSERTION',
    'ER_BAD_FIELD_ERROR',
    'ER_NO_DEFAULT_FOR_FIELD',
    'ER_NO_SUCH_TABLE',
    'ER_NON_UNIQ_ERROR'
  ]

  handleErrors(error: Error): Error {
    this.logger.error(error.message)

    if (error.message.startsWith('#')) {
      return error
    } else {
      return new InternalServerErrorException(
        '#Erro interno. Informe o time de suporte para correção.'
      )
    }
  }
}
