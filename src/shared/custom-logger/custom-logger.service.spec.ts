import { Test, TestingModule } from '@nestjs/testing'
import { CustomLoggerService } from './custom-logger.service'
import { appendFileSync } from 'fs'
import { join } from 'path'

// Mock do 'fs' para controlar a função appendFileSync
jest.mock('fs')

describe('CustomLoggerService', () => {
  let service: CustomLoggerService
  const mockedAppendFileSync = appendFileSync as jest.Mock
  const logFilePath = join(__dirname, '..', '..', '..', 'logs', 'app.log')

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomLoggerService]
    }).compile()

    service = module.get<CustomLoggerService>(CustomLoggerService)
    // Limpa as chamadas ao mock antes de cada teste
    mockedAppendFileSync.mockClear()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should call appendFileSync with the correct log message for log()', () => {
    const message = 'Test log message'
    const context = 'TestContext'

    service.log(message, context)
    expect(mockedAppendFileSync).toHaveBeenCalledTimes(1)
    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      logFilePath,
      expect.stringContaining(`[LOG] {${context}} ${message} \n`)
    )
  })

  it('should call appendFileSync with the correct log message for error()', () => {
    const message = 'Test error message'
    const context = 'TestContext'

    service.error(message, undefined, context)
    expect(mockedAppendFileSync).toHaveBeenCalledTimes(1)
    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      logFilePath,
      expect.stringContaining(`[ERROR] {${context}} ${message} \n`)
    )
  })

  it('should call appendFileSync with the correct log message for error()', () => {
    const message = 'Test error message'
    const context = 'TestContext'

    try {
      throw new Error('erro')
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      service.error(message, error.stack, context)
    }

    service.error(message, undefined, context)
    // expect(mockedAppendFileSync).toHaveBeenCalledTimes(1)
    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      logFilePath,
      expect.stringContaining(`[ERROR] {${context}} ${message} \n`)
    )
  })

  it('should call appendFileSync with the correct log message for warn()', () => {
    const message = 'Test warn message'
    const context = 'TestContext'

    service.warn(message, context)
    expect(mockedAppendFileSync).toHaveBeenCalledTimes(1)
    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      logFilePath,
      expect.stringContaining(`[WARN] {${context}} ${message} \n`)
    )
  })

  it('should call appendFileSync with the correct log message for debug()', () => {
    const message = 'Test debug message'

    service.debug(message)
    expect(mockedAppendFileSync).toHaveBeenCalledTimes(1)
    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      logFilePath,
      expect.stringContaining(`[DEBUG]  ${message}`)
    )
  })

  it('should call appendFileSync with the correct log message for verbose()', () => {
    const message = 'Test verbose message'

    service.verbose(message)
    expect(mockedAppendFileSync).toHaveBeenCalledTimes(1)
    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      logFilePath,
      expect.stringContaining(`[VERBOSE]  ${message}`)
    )
  })
})
