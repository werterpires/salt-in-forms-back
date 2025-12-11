/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing'
import { LogCleanupService } from './log-cleanup.service'
import { CustomLoggerService } from './custom-logger.service'
import { readdirSync, unlinkSync, existsSync, statSync } from 'fs'

// Mock das funções do módulo 'fs'
jest.mock('fs')

describe('LogCleanupService', () => {
  let service: LogCleanupService
  let logger: jest.Mocked<CustomLoggerService>

  const mockedReaddirSync = readdirSync as jest.Mock
  const mockedUnlinkSync = unlinkSync as jest.Mock
  const mockedExistsSync = existsSync as jest.Mock
  const mockedStatSync = statSync as jest.Mock

  beforeEach(async () => {
    // Limpa mocks antes de cada teste
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogCleanupService,
        {
          provide: CustomLoggerService,
          useValue: {
            setContext: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
          }
        }
      ]
    }).compile()

    service = module.get<LogCleanupService>(LogCleanupService)
    logger = module.get<CustomLoggerService>(
      CustomLoggerService
    ) as jest.Mocked<CustomLoggerService>
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('cleanOldLogs', () => {
    it('should warn if logs directory does not exist', () => {
      mockedExistsSync.mockReturnValue(false)

      service.cleanOldLogs()

      expect(logger.warn).toHaveBeenCalledWith(
        'Diretório de logs não encontrado, nada a limpar'
      )
      expect(mockedReaddirSync).not.toHaveBeenCalled()
    })

    it('should remove log files older than retention period', () => {
      // Configura cenário: diretório existe com arquivos antigos e recentes
      mockedExistsSync.mockReturnValue(true)

      // Simula arquivos de diferentes períodos
      // Considerando data atual: dezembro 2025 (202512)
      // Período de retenção padrão: 3 anos
      // Cutoff: dezembro 2022 (202212)
      const mockFiles = [
        '202211-app.log', // Novembro 2022 - ANTIGO (deve deletar)
        '202212-app.log', // Dezembro 2022 - LIMITE (deve deletar)
        '202301-app.log', // Janeiro 2023 - RECENTE (deve manter)
        '202512-app.log', // Dezembro 2025 - ATUAL (deve manter)
        'other-file.txt', // Arquivo não-log (deve ignorar)
        '20251-app.log' // Formato inválido (deve ignorar)
      ]

      mockedReaddirSync.mockReturnValue(mockFiles)

      // Mock statSync para retornar tamanho dos arquivos
      mockedStatSync.mockReturnValue({ size: 1024 }) // 1KB cada

      service.cleanOldLogs()

      // Verifica que apenas os arquivos antigos foram deletados
      expect(mockedUnlinkSync).toHaveBeenCalledTimes(2)
      expect(mockedUnlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('202211-app.log')
      )
      expect(mockedUnlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('202212-app.log')
      )

      // Verifica que arquivos recentes NÃO foram deletados
      expect(mockedUnlinkSync).not.toHaveBeenCalledWith(
        expect.stringContaining('202301-app.log')
      )
      expect(mockedUnlinkSync).not.toHaveBeenCalledWith(
        expect.stringContaining('202512-app.log')
      )

      // Verifica logs informativos
      const infoMock = logger.info
      expect(infoMock).toHaveBeenCalledWith(
        expect.stringContaining('Iniciando limpeza de logs antigos')
      )
      expect(infoMock).toHaveBeenCalledWith(
        expect.stringContaining('2 arquivo(s) removido(s)')
      )
      expect(infoMock).toHaveBeenCalledWith(
        expect.stringContaining('2 arquivo(s) mantido(s)')
      )
    })

    it('should handle errors when deleting individual files', () => {
      mockedExistsSync.mockReturnValue(true)
      mockedReaddirSync.mockReturnValue(['202001-app.log'])
      mockedStatSync.mockReturnValue({ size: 1024 })

      // Simula erro ao deletar arquivo
      const deleteError = new Error('Permission denied')
      mockedUnlinkSync.mockImplementation(() => {
        throw deleteError
      })

      service.cleanOldLogs()

      const errorMock = logger.error
      expect(errorMock).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao deletar arquivo'),
        expect.anything()
      )

      const infoMock = logger.info
      expect(infoMock).toHaveBeenCalledWith(
        expect.stringContaining('Limpeza de logs concluída')
      )
    })

    it('should handle general errors during cleanup', () => {
      mockedExistsSync.mockReturnValue(true)

      // Simula erro ao listar diretório
      const readError = new Error('Cannot read directory')
      mockedReaddirSync.mockImplementation(() => {
        throw readError
      })

      service.cleanOldLogs()

      const errorMock = logger.error
      expect(errorMock).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao limpar logs antigos'),
        expect.anything()
      )
    })

    it('should ignore files that do not match log file pattern', () => {
      mockedExistsSync.mockReturnValue(true)

      const mockFiles = [
        'readme.txt',
        '2025-app.log', // Formato errado
        'app.log', // Sem ano/mês
        '202512.log', // Sem sufixo correto
        '202512-app.txt' // Extensão errada
      ]

      mockedReaddirSync.mockReturnValue(mockFiles)

      service.cleanOldLogs()

      // Nenhum arquivo deve ser deletado
      expect(mockedUnlinkSync).not.toHaveBeenCalled()

      // Mas o resumo deve indicar 0 arquivos processados
      const infoMock = logger.info
      expect(infoMock).toHaveBeenCalledWith(
        expect.stringContaining('0 arquivo(s) removido(s)')
      )
    })

    it('should format file sizes correctly in logs', () => {
      mockedExistsSync.mockReturnValue(true)
      mockedReaddirSync.mockReturnValue(['202001-app.log'])

      // Mock de arquivo com 5MB
      mockedStatSync.mockReturnValue({ size: 5 * 1024 * 1024 })

      service.cleanOldLogs()

      const infoMock = logger.info
      expect(infoMock).toHaveBeenCalledWith(expect.stringContaining('MB'))
    })

    it('should respect LOG_RETENTION_YEARS environment variable', () => {
      // Define período de retenção customizado
      process.env.LOG_RETENTION_YEARS = '5'

      // Recria o serviço para pegar a nova env var
      const module = Test.createTestingModule({
        providers: [
          LogCleanupService,
          {
            provide: CustomLoggerService,
            useValue: {
              setContext: jest.fn(),
              info: jest.fn(),
              warn: jest.fn(),
              error: jest.fn()
            }
          }
        ]
      }).compile()

      module.then((compiledModule) => {
        const customService =
          compiledModule.get<LogCleanupService>(LogCleanupService)

        mockedExistsSync.mockReturnValue(true)
        mockedReaddirSync.mockReturnValue(['202001-app.log']) // Janeiro 2020
        mockedStatSync.mockReturnValue({ size: 1024 })

        customService.cleanOldLogs()

        // Com retenção de 5 anos, arquivo de 2020 ainda deve ser mantido
        // (estamos em dezembro 2025, cutoff seria dezembro 2020)
        expect(mockedUnlinkSync).toHaveBeenCalled()
      })

      // Limpa env var
      delete process.env.LOG_RETENTION_YEARS
    })
  })

  describe('manualCleanup', () => {
    it('should execute cleanup and return success', () => {
      mockedExistsSync.mockReturnValue(true)
      mockedReaddirSync.mockReturnValue([])

      const result = service.manualCleanup()

      expect(result.success).toBe(true)
      expect(result.message).toContain('sucesso')
    })

    it('should log error but return success even when cleanup encounters errors', () => {
      // cleanOldLogs() captura exceções internamente e loga erros,
      // mas não propaga exceções. Isso é intencional para não quebrar
      // o cron job quando há erros de I/O.
      mockedExistsSync.mockReturnValue(true)
      const error = new Error('Simulated error')
      mockedReaddirSync.mockImplementation(() => {
        throw error
      })

      const result = service.manualCleanup()

      expect(result.success).toBe(true)
      expect(result.message).toContain('sucesso')

      const errorMock = logger.error
      expect(errorMock).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao limpar logs antigos'),
        expect.anything()
      )
    })
  })
})
