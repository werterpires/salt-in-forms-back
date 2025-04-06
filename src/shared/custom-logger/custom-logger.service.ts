import { Injectable, LoggerService } from '@nestjs/common'
import { appendFileSync } from 'fs'
import { join } from 'path'

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logFilePath = join(__dirname, '..', '..', '..', 'logs', 'app.log')

  private writeLog(
    level: string,
    message: any,
    trace?: string,
    context?: string
  ) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level}] ${context ? `{${context}}` : ''} ${message} ${trace ? `\nStacktrace: ${trace}` : ''}\n`
    appendFileSync(this.logFilePath, logMessage)
  }

  log(message: any, context?: string) {
    this.writeLog('LOG', message, undefined, context)
  }

  error(message: any, trace?: string, context?: string) {
    console.log('trace', trace)
    this.writeLog('ERROR', message, trace, context)
  }

  warn(message: any, context?: string) {
    this.writeLog('WARN', message, undefined, context)
  }

  debug?(message: any) {
    this.writeLog('DEBUG', message)
  }

  verbose?(message: any) {
    this.writeLog('VERBOSE', message)
  }
}
