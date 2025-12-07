import { ConsoleLogger, Injectable, Scope } from '@nestjs/common'
import { appendFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLoggerService extends ConsoleLogger {
  /**
   * Gera o caminho do arquivo de log para o mês atual.
   * Formato: YYYYMM-app.log (ex: 202512-app.log para dezembro de 2025)
   *
   * Esta abordagem permite rotação automática de logs por mês,
   * facilitando a limpeza de logs antigos sem processar conteúdo.
   */
  private getLogFilePath(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const filename = `${year}${month}-app.log`
    return join(process.cwd(), 'logs', filename)
  }

  private ensureLogDirectoryExists() {
    const dir = dirname(this.getLogFilePath())
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }

  private writeLog(level: string, message: any, trace?: any, context?: string) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level}] ${context ? `{${context}}` : ''} ${message} ${trace ? `\nStacktrace: ${trace}` : ''}\n`

    if (level === 'LOG') {
      console.log(logMessage)
      return
    }

    this.ensureLogDirectoryExists()
    appendFileSync(this.getLogFilePath(), logMessage)
  }

  override log(message: any, context?: string) {
    this.writeLog('LOG', message, undefined, context)
  }

  info(message: any, context?: string) {
    this.writeLog('INFO', message, undefined, context)
  }

  override error(message: any, trace?: any, context?: string) {
    this.writeLog('ERROR', message, trace, context)
  }

  override warn(message: any, context?: string) {
    this.writeLog('WARN', message, undefined, context)
  }

  override debug(message: any) {
    this.writeLog('DEBUG', message)
  }

  override verbose(message: any) {
    this.writeLog('VERBOSE', message)
  }
}
