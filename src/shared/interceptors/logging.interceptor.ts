import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { Request } from 'express'
import { CustomLoggerService } from '../utils-module/custom-logger/custom-logger.service'
import { ValidateUser } from '../auth/types'
import { randomUUID } from 'crypto'

interface AuthRequest extends Request {
  user?: ValidateUser
  requestId?: string
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {
    this.logger.setContext('LoggingInterceptor')
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp()
    const request = httpContext.getRequest<AuthRequest>()
    const { method, url, body, params, query, user } = request

    // Gerar ID único para esta requisição
    const requestId = randomUUID()
    request.requestId = requestId

    // a) Ignorar requisições GET
    if (method === 'GET') {
      return next.handle()
    }

    // Redatar campos sensíveis do payload
    const redactedBody = this.redactSensitiveData(body)
    const redactedParams = this.redactSensitiveData(params)
    const redactedQuery = this.redactSensitiveData(query)

    // Montar payload para logging
    const payload = {
      ...(Object.keys(redactedBody || {}).length > 0 && { body: redactedBody }),
      ...(Object.keys(redactedParams || {}).length > 0 && {
        params: redactedParams
      }),
      ...(Object.keys(redactedQuery || {}).length > 0 && {
        query: redactedQuery
      })
    }

    const payloadString =
      Object.keys(payload).length > 0 ? JSON.stringify(payload) : '{}'

    // c) Logar requisição inicial
    if (user?.userId) {
      this.logger.info(
        `[${requestId}] Usuário ${user.userId} chamou ${method} ${url} com payload ${payloadString}`
      )
    } else {
      // d) Logar sem usuário (endpoints públicos)
      this.logger.info(
        `[${requestId}] Endpoint ${method} ${url} chamado com payload ${payloadString}`
      )
    }

    // Capturar apenas sucesso (erros são logados pelo GlobalErrorsFilter)
    return next.handle().pipe(
      tap(() => {
        this.logger.info(
          `[${requestId}] Requisição ${method} ${url} concluída com sucesso`
        )
      })
    )
  }

  /**
   * Remove campos sensíveis do objeto, substituindo por '[REDACTED]'
   */
  private redactSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data
    }

    // Lista de campos sensíveis a serem redatados
    const sensitiveFields = [
      'password',
      'userPassword',
      'uniqueDocument',
      'candidateUniqueDocument',
      'candidateName',
      'candidateEmail',
      'candidatePhone',
      'candidateCpf',
      'candidateCellPhone',
      'candidateBirthdate',
      'candidateAddress',
      'candidateAddressNumber',
      'candidateDistrict',
      'candidateCity',
      'candidateState',
      'candidateZipCode',
      'candidateCountry'
    ]

    const redacted = Array.isArray(data) ? [...data] : { ...data }

    for (const key in redacted) {
      if (sensitiveFields.includes(key)) {
        redacted[key] = '[REDACTED]'
      } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
        // Recursivamente redatar objetos aninhados
        redacted[key] = this.redactSensitiveData(redacted[key])
      }
    }

    return redacted
  }
}
