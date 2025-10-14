import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { CustomLoggerService } from '../custom-logger/custom-logger.service'
import { ExternalApiService } from '../external-api/external-api.service'

interface SendPulseTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

@Injectable()
export class SendPulseService {
  private accessToken: string | null = null
  private readonly baseUrl: string
  private readonly clientId: string
  private readonly clientSecret: string

  constructor(
    private readonly logger: CustomLoggerService,
    private readonly externalApiService: ExternalApiService
  ) {
    this.logger.setContext('SendPulseService')

    if (!process.env.SENDPULSE_BASE_URL) {
      throw new InternalServerErrorException(
        'SENDPULSE_BASE_URL não está definido no .env'
      )
    }
    if (!process.env.SENDPULSE_CLIENT_ID) {
      throw new InternalServerErrorException(
        'SENDPULSE_CLIENT_ID não está definido no .env'
      )
    }
    if (!process.env.SENDPULSE_CLIENT_SECRET) {
      throw new InternalServerErrorException(
        'SENDPULSE_CLIENT_SECRET não está definido no .env'
      )
    }

    this.baseUrl = process.env.SENDPULSE_BASE_URL
    this.clientId = process.env.SENDPULSE_CLIENT_ID
    this.clientSecret = process.env.SENDPULSE_CLIENT_SECRET

    // Inicializa o token ao criar o serviço
    this.initializeToken()
  }

  private async initializeToken() {
    try {
      await this.refreshToken()
      this.logger.log('SendPulse token inicializado com sucesso')
    } catch (error) {
      this.logger.error('Erro ao inicializar token do SendPulse', error.stack)
    }
  }

  @Interval(50 * 60 * 1000)
  async refreshToken() {
    try {
      this.logger.log('Renovando token do SendPulse...')

      const response =
        await this.externalApiService.post<SendPulseTokenResponse>(
          `${this.baseUrl}/oauth/access_token`,
          {
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret
          }
        )

      this.accessToken = response.data.access_token
      console.log('New SendPulse Access Token:', this.accessToken) // Log do token
      this.logger.log('Token do SendPulse renovado com sucesso')
    } catch (error) {
      this.logger.error('Erro ao renovar token do SendPulse', error.stack)
      throw new InternalServerErrorException(
        'Falha ao autenticar com SendPulse'
      )
    }
  }

  getAccessToken(): string {
    if (!this.accessToken) {
      throw new InternalServerErrorException(
        'Token do SendPulse não está disponível'
      )
    }
    return this.accessToken
  }

  getAuthorizationHeader(): string {
    return `Bearer ${this.getAccessToken()}`
  }

  async makeAuthenticatedRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: any
  ) {
    const headers = {
      Authorization: this.getAuthorizationHeader()
    }

    const url = `${this.baseUrl}${endpoint}`

    return this.externalApiService.request<T>(url, method, body, headers)
  }
}
