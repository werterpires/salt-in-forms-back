import { Injectable, BadRequestException } from '@nestjs/common'
import { ExternalApiService } from '../shared/utils-module/external-api/external-api.service'
import { CustomLoggerService } from '../shared/utils-module/custom-logger/custom-logger.service'
import { Order, AuthenticationResponse, GetOrdersResponse } from './types'

/**
 * Resultado da validação de um orderCode
 */
export interface OrderValidationResult {
  isValid: boolean
  orderData?: Order
  message: string
}

/**
 * Serviço para validação de códigos de pedido na API externa
 * Gerencia autenticação, cache de token e validação de orderCodes
 */
@Injectable()
export class ExternalOrderValidationService {
  private token: string | null = null
  private tokenExpiration: Date | null = null

  constructor(
    private readonly externalApiService: ExternalApiService,
    private readonly logger: CustomLoggerService
  ) {
    this.logger.setContext('ExternalOrderValidationService')
  }

  /**
   * Autentica na API externa e obtém o token JWT
   * @returns Token de autenticação válido
   * @throws BadRequestException se as credenciais forem inválidas
   */
  private async authenticate(): Promise<string> {
    const apiUrl = process.env.EXTERNAL_API_BASE_URL
    const email = process.env.EXTERNAL_API_EMAIL
    const password = process.env.EXTERNAL_API_PASSWORD

    // Validar variáveis de ambiente
    if (!apiUrl || !email || !password) {
      this.logger.error(
        'Configurações da API externa não definidas no .env',
        JSON.stringify({
          hasUrl: !!apiUrl,
          hasEmail: !!email,
          hasPassword: !!password
        })
      )
      throw new BadRequestException(
        '#Configurações da API externa não estão disponíveis'
      )
    }

    try {
      this.logger.log('Iniciando autenticação na API externa...')

      const response =
        await this.externalApiService.post<AuthenticationResponse>(
          `${apiUrl}/Authentication/Login`,
          {
            UserEmail: email,
            Password: password
          }
        )

      // Validar resposta de autenticação
      if (!response.data.authenticated) {
        this.logger.error(
          'Falha na autenticação com API externa',
          JSON.stringify(response.data)
        )
        throw new BadRequestException('#Falha na autenticação com API externa')
      }

      // Armazenar token e data de expiração
      this.token = response.data.token
      this.tokenExpiration = new Date(response.data.expiration)

      this.logger.log(
        `Autenticado com sucesso na API externa. Token expira em: ${this.tokenExpiration.toISOString()}`
      )

      return this.token
    } catch (error) {
      this.logger.error('Erro ao autenticar na API externa:', error.stack)

      // Se for um erro HTTP já tratado, repassa
      if (error instanceof BadRequestException) {
        throw error
      }

      throw new BadRequestException(
        '#Erro ao conectar com o serviço de validação de pedidos'
      )
    }
  }

  /**
   * Garante que temos um token válido
   * Se não houver token ou ele estiver expirado, autentica novamente
   * @returns Token válido
   */
  private async ensureValidToken(): Promise<string> {
    const now = new Date()

    // Verificar se token existe e não está expirado
    if (this.token && this.tokenExpiration && now < this.tokenExpiration) {
      this.logger.log('Token ainda é válido, reutilizando...')
      return this.token
    }

    // Token expirado ou não existe, autenticar novamente
    this.logger.log('Token expirado ou inexistente, autenticando...')
    return await this.authenticate()
  }

  /**
   * Valida um código de pedido na API externa
   * @param orderCode Código do pedido a ser validado
   * @param dataKey Identificador do tenant (ex: "FAAMA")
   * @returns Resultado da validação com dados do pedido se válido
   */
  async validateOrderCode(
    orderCode: string,
    dataKey: string
  ): Promise<OrderValidationResult> {
    try {
      this.logger.log(
        `Validando orderCode: ${orderCode} para tenant: ${dataKey}`
      )

      // Garantir que temos um token válido
      const token = await this.ensureValidToken()

      const apiUrl = process.env.EXTERNAL_API_BASE_URL
      if (!apiUrl) {
        throw new BadRequestException('#URL da API externa não configurada')
      }

      // Buscar pedido específico (página 1, tamanho 1, filtrado por orderCode)
      const endpoint = `${apiUrl}/AdminArea/GetTenantOrders/${dataKey}/1/1?orderCode=${orderCode}`

      this.logger.log(`Fazendo requisição para: ${endpoint}`)

      const response = await this.externalApiService.get<GetOrdersResponse>(
        endpoint,
        {
          Authorization: `Bearer ${token}`
        }
      )

      // Verificar se encontrou o pedido
      if (!response.data.entities || response.data.entities.length === 0) {
        this.logger.warn(
          `OrderCode ${orderCode} não encontrado para tenant ${dataKey}`
        )
        return {
          isValid: false,
          message: '#Código de pedido não encontrado'
        }
      }

      const order = response.data.entities[0]

      this.logger.log(
        `Pedido encontrado: ${order.orderId}, Status: ${order.orderStatus}`
      )

      // Verificar se o pedido está pago (status 30 = pago)
      const isPaid = order.orderPayments?.some(
        (payment) => payment.paymentStatus === 30
      )

      if (!isPaid) {
        this.logger.warn(
          `Pedido ${order.orderId} não está pago. Status dos pagamentos: ${JSON.stringify(
            order.orderPayments?.map((p) => p.paymentStatus)
          )}`
        )
        return {
          isValid: false,
          message: '#Pedido não está pago ou confirmado'
        }
      }

      // Verificar se o orderCode do pedido corresponde ao informado
      if (order.orderCode.toString() !== orderCode) {
        this.logger.error(
          `OrderCode não corresponde: esperado ${orderCode}, recebido ${order.orderCode}`
        )
        return {
          isValid: false,
          message: '#Código de pedido inválido'
        }
      }

      this.logger.log(
        `OrderCode ${orderCode} validado com sucesso para tenant ${dataKey}`
      )

      return {
        isValid: true,
        orderData: order,
        message: 'Pedido validado com sucesso'
      }
    } catch (error) {
      this.logger.error(
        `Erro ao validar código de pedido ${orderCode}:`,
        error.stack
      )

      // Se for um erro HTTP já tratado, repassa
      if (error instanceof BadRequestException) {
        throw error
      }

      return {
        isValid: false,
        message:
          '#Erro ao validar código de pedido. Tente novamente mais tarde.'
      }
    }
  }

  /**
   * Limpa o cache de token (útil para testes ou forçar re-autenticação)
   */
  clearTokenCache(): void {
    this.logger.log('Cache de token limpo')
    this.token = null
    this.tokenExpiration = null
  }
}
