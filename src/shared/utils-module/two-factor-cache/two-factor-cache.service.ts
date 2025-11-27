import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { CustomLoggerService } from '../custom-logger/custom-logger.service'

export interface TwoFactorData {
  code: string
  userId: number
  expiresAt: Date
  attempts: number
}

@Injectable()
export class TwoFactorCacheService {
  private readonly cache = new Map<string, TwoFactorData>()
  private readonly TTL_MINUTES = 30
  private readonly MAX_ATTEMPTS = 5

  constructor(private readonly logger: CustomLoggerService) {
    this.logger.setContext('TwoFactorCacheService')
  }

  /**
   * Gera código alfanumérico de 6 dígitos (A-Z0-9 maiúsculos)
   */
  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * Armazena código 2FA para um email
   */
  set(email: string, userId: number): string {
    const code = this.generateCode()
    console.log('código gerado:', code)
    const expiresAt = new Date(Date.now() + this.TTL_MINUTES * 60 * 1000)

    this.cache.set(email.toLowerCase(), {
      code,
      userId,
      expiresAt,
      attempts: 0
    })

    this.logger.log(
      `Código 2FA gerado para ${email}, expira em ${expiresAt.toISOString()}`
    )
    return code
  }

  /**
   * Valida código 2FA
   * @returns userId se válido, null se inválido/expirado
   */
  validate(email: string, code: string): number | null {
    const data = this.cache.get(email.toLowerCase())

    if (!data) {
      this.logger.warn(`Código 2FA não encontrado para ${email}`)
      return null
    }

    // Verificar expiração
    if (new Date() > data.expiresAt) {
      this.logger.warn(`Código 2FA expirado para ${email}`)
      this.cache.delete(email.toLowerCase())
      return null
    }

    // Incrementar tentativas
    data.attempts++

    // Verificar máximo de tentativas
    if (data.attempts > this.MAX_ATTEMPTS) {
      this.logger.warn(`Máximo de tentativas excedido para ${email}`)
      this.cache.delete(email.toLowerCase())
      return null
    }

    // Validar código
    if (data.code !== code.toUpperCase()) {
      this.logger.warn(
        `Código 2FA incorreto para ${email} (tentativa ${data.attempts}/${this.MAX_ATTEMPTS})`
      )
      return null
    }

    // Código válido - remover do cache
    this.cache.delete(email.toLowerCase())
    this.logger.log(`Código 2FA validado com sucesso para ${email}`)
    return data.userId
  }

  /**
   * Verifica se existe código válido para o email
   */
  has(email: string): boolean {
    const data = this.cache.get(email.toLowerCase())
    if (!data) return false

    // Verificar se não expirou
    if (new Date() > data.expiresAt) {
      this.cache.delete(email.toLowerCase())
      return false
    }

    return true
  }

  /**
   * Remove código 2FA do cache
   */
  delete(email: string): void {
    this.cache.delete(email.toLowerCase())
  }

  /**
   * Limpeza automática de códigos expirados a cada 5 minutos
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  cleanExpiredCodes() {
    const now = new Date()
    let cleaned = 0

    for (const [email, data] of this.cache.entries()) {
      if (now > data.expiresAt) {
        this.cache.delete(email)
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.logger.log(
        `Limpeza automática: ${cleaned} código(s) 2FA expirado(s) removido(s)`
      )
    }
  }

  /**
   * Retorna estatísticas do cache (útil para debug)
   */
  getStats() {
    return {
      totalCodes: this.cache.size,
      codes: Array.from(this.cache.entries()).map(([email, data]) => ({
        email,
        expiresAt: data.expiresAt,
        attempts: data.attempts
      }))
    }
  }
}
