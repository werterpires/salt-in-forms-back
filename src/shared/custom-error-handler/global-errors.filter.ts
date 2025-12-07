import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common'
import { ThrottlerException } from '@nestjs/throttler'

import { Request, Response } from 'express'
import { CustomErrorHandlerService } from './custom-error-handler.service'
import { CustomLoggerService } from '../utils-module/custom-logger/custom-logger.service'
import { v4 as uuidv4 } from 'uuid'

@Catch()
export class GlobalErrorsFilter implements ExceptionFilter {
  constructor(
    private readonly errorsService: CustomErrorHandlerService,
    private readonly logger: CustomLoggerService
  ) {
    this.logger.setContext(GlobalErrorsFilter.name)
  }
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<Request & { requestId?: string }>()
    const response = ctx.getResponse<Response>()

    // Usar requestId do interceptor se disponível, senão gerar novo
    const uniqueId = request.requestId || uuidv4()
    this.logger.error(`[${uniqueId}] ${exception.message}`, exception.stack)

    const isHttpException = exception instanceof HttpException
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR

    let errorResponse: string | object

    // Tratamento especial para ThrottlerException
    if (exception instanceof ThrottlerException) {
      errorResponse = {
        response: {
          message:
            '#Muitas tentativas. Aguarde 1 hora antes de tentar novamente.',
          error: 'Too Many Requests',
          statusCode: 429
        },
        status: 429,
        options: {},
        message:
          '#Muitas tentativas. Aguarde 1 hora antes de tentar novamente.',
        name: 'ThrottlerException'
      }
    } else if (isHttpException && exception.message.startsWith('#')) {
      errorResponse = exception.getResponse()
    } else {
      errorResponse = this.errorsService.handleErrors(exception, uniqueId)
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: errorResponse || 'internal server error bonitão'
    })
  }
}
