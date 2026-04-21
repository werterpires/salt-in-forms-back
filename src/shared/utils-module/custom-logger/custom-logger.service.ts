import { ConsoleLogger, Injectable } from '@nestjs/common'
import { appendFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

@Injectable()
export class CustomLoggerService extends ConsoleLogger {
  private logsEnabled = true

  constructor() {
    console.log('[DIAGNOSTIC] CustomLoggerService: Starting constructor')
    try {
      super()
      console.log(
        '[DIAGNOSTIC] CustomLoggerService: Constructor completed successfully'
      )
    } catch (error) {
      console.error(
        '[DIAGNOSTIC] CustomLoggerService: Constructor failed:',
        error
      )
      throw error
    }
  }

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
    try {
      const dir = dirname(this.getLogFilePath())
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
    } catch (error) {
      // Se falhar ao criar diretório, desabilita logs em arquivo
      console.warn(
        'Failed to create logs directory, file logging disabled:',
        error
      )
      this.logsEnabled = false
    }
  }

  private writeLog(level: string, message: any, trace?: any, context?: string) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level}] ${context ? `{${context}}` : ''} ${message} ${trace ? `\nStacktrace: ${trace}` : ''}\n`

    // Sempre loga no console
    if (level === 'ERROR' || level === 'WARN') {
      console.error(logMessage)
    } else {
      console.log(logMessage)
    }

    // Tenta gravar em arquivo se habilitado
    if (this.logsEnabled && level !== 'LOG') {
      try {
        this.ensureLogDirectoryExists()
        appendFileSync(this.getLogFilePath(), logMessage)
      } catch (e) {
        // Falha silenciosa em produção
        const errorMessage = e instanceof Error ? e.message : String(e)
        this.writeLog(
          'LOG',
          'Failed to write log to file, disabling file logging. Error: ' +
            errorMessage
        )
        this.logsEnabled = false
      }
    }
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
