import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { CustomLoggerService } from '../custom-logger/custom-logger.service'

export interface ApiResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: any
}

export interface ApiError {
  message: string
  status: number
  response?: any
}

@Injectable()
export class ExternalApiService {
  constructor(private readonly logger: CustomLoggerService) {
    this.logger.setContext('ExternalApiService')
  }

  async request<T = any>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    try {
      this.logger.log(`Making ${method} request to: ${url}`)

      const config: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }

      if (body && method !== 'GET') {
        config.body = JSON.stringify(body)
      }

      const response = await fetch(url, config)

      let data: T
      const contentType = response.headers.get('content-type')

      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = (await response.text()) as T
      }

      if (!response.ok) {
        this.logger.error(
          `API request failed: ${response.status} - ${response.statusText}`,
          JSON.stringify(data)
        )
        throw new HttpException(
          {
            message: 'External API request failed',
            status: response.status,
            response: data
          } as ApiError,
          response.status >= 500
            ? HttpStatus.BAD_GATEWAY
            : HttpStatus.BAD_REQUEST
        )
      }

      this.logger.log(`API request successful: ${response.status}`)

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }

      this.logger.error('Unexpected error during API request', error.stack)
      throw new HttpException(
        {
          message: 'Failed to connect to external API',
          status: 0,
          response: error.message
        } as ApiError,
        HttpStatus.BAD_GATEWAY
      )
    }
  }

  async get<T = any>(
    url: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, 'GET', undefined, headers)
  }

  async post<T = any>(
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, 'POST', body, headers)
  }

  async put<T = any>(
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, 'PUT', body, headers)
  }

  async patch<T = any>(
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, 'PATCH', body, headers)
  }

  async delete<T = any>(
    url: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, 'DELETE', undefined, headers)
  }
}
