import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { readdirSync, unlinkSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { CustomLoggerService } from './custom-logger.service'

/**
 * Serviço responsável pela limpeza automática de logs antigos.
 *
 * Funcionalidades principais:
 * - Remove automaticamente arquivos de log com mais de X anos (configurável via LOG_RETENTION_YEARS)
 * - Usa rotação de logs por mês (formato YYYYMM-app.log)
 * - Deleta arquivos inteiros ao invés de processar conteúdo (muito mais eficiente)
 * - Executa mensalmente de forma automatizada
 * - Permite execução manual para testes e manutenção
 *
 * Estratégia de rotação:
 * - Cada mês gera um arquivo separado (ex: 202512-app.log)
 * - Limpeza verifica idade pela data no nome do arquivo
 * - Deleta arquivos inteiros de meses antigos (operação O(1))
 * - Muito mais eficiente que processar conteúdo linha por linha
 */
@Injectable()
export class LogCleanupService {
  /** Caminho absoluto para o diretório de logs da aplicação */
  private logsDirectory = join(process.cwd(), 'logs')

  /** Período de retenção de logs em anos (configurável via env) */
  private retentionYears = parseInt(process.env.LOG_RETENTION_YEARS || '3', 10)

  constructor(private readonly logger: CustomLoggerService) {
    this.logger.setContext('LogCleanupService')
  }

  /**
   * Executa limpeza de logs no primeiro dia de cada mês à meia-noite.
   *
   * Estratégia de limpeza (muito mais eficiente):
   * 1. Lista todos os arquivos de log no formato YYYYMM-app.log
   * 2. Extrai ano/mês do nome do arquivo
   * 3. Compara com período de retenção configurado
   * 4. Deleta arquivos inteiros de meses antigos
   *
   * Vantagens sobre abordagem anterior:
   * - O(1) de memória ao invés de O(n)
   * - Milissegundos ao invés de minutos para arquivos grandes
   * - Não precisa processar conteúdo dos arquivos
   * - Operação de deleção é atômica e rápida
   *
   * @cron Primeiro dia de cada mês às 00:00
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  cleanOldLogs() {
    this.logger.info(
      `Iniciando limpeza de logs antigos (>${this.retentionYears} anos)`
    )

    try {
      // Verifica se o diretório de logs existe
      if (!existsSync(this.logsDirectory)) {
        this.logger.warn('Diretório de logs não encontrado, nada a limpar')
        return
      }

      // Define a data limite: arquivos de meses anteriores a esta data serão removidos
      const cutoffDate = new Date()
      cutoffDate.setFullYear(cutoffDate.getFullYear() - this.retentionYears)
      const cutoffYearMonth =
        cutoffDate.getFullYear() * 100 + (cutoffDate.getMonth() + 1)

      // Lista todos os arquivos no diretório de logs
      const files = readdirSync(this.logsDirectory)

      // Regex para identificar arquivos de log no formato YYYYMM-app.log
      const logFilePattern = /^(\d{6})-app\.log$/

      let removedCount = 0
      let keptCount = 0
      let totalSizeRemoved = 0

      for (const file of files) {
        const match = file.match(logFilePattern)

        if (!match) {
          // Não é um arquivo de log no formato esperado, ignora
          continue
        }

        // Extrai YYYYMM do nome do arquivo (ex: 202512 de "202512-app.log")
        const yearMonth = parseInt(match[1], 10)
        const filePath = join(this.logsDirectory, file)

        if (yearMonth <= cutoffYearMonth) {
          // Arquivo antigo: obter tamanho antes de deletar
          try {
            const stats = statSync(filePath)
            totalSizeRemoved += stats.size

            // Deleta o arquivo inteiro
            unlinkSync(filePath)
            removedCount++

            this.logger.info(
              `Arquivo de log removido: ${file} (${this.formatBytes(stats.size)})`
            )
          } catch (deleteError) {
            this.logger.error(
              `Erro ao deletar arquivo ${file}: ${deleteError.message}`,
              deleteError.stack
            )
          }
        } else {
          // Arquivo recente: mantém
          keptCount++
        }
      }

      this.logger.info(
        `Limpeza de logs concluída: ${removedCount} arquivo(s) removido(s) ` +
          `(${this.formatBytes(totalSizeRemoved)}), ${keptCount} arquivo(s) mantido(s)`
      )
    } catch (error) {
      this.logger.error(
        `Erro ao limpar logs antigos: ${error.message}`,
        error.stack
      )
    }
  }

  /**
   * Formata bytes em formato legível (KB, MB, GB)
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  /**
   * Método manual para execução de limpeza fora do agendamento automático.
   *
   * Útil para:
   * - Testes de integração
   * - Manutenção emergencial
   * - Validação antes de deploy
   *
   * @returns Objeto com resultado da operação e estatísticas
   */
  manualCleanup(): {
    success: boolean
    message: string
    removedCount?: number
    keptCount?: number
  } {
    try {
      this.cleanOldLogs()
      return {
        success: true,
        message: 'Limpeza manual executada com sucesso'
      }
    } catch (error: any) {
      this.logger.error(`Erro na limpeza manual: ${error.message}`, error.stack)
      return {
        success: false,
        message: `Erro na limpeza manual: ${error.message}`
      }
    }
  }
}
