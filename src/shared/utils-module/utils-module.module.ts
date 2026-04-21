import { Global, Module } from '@nestjs/common'
import { CustomLoggerModule } from './custom-logger/custom-logger.module'
import { LogCleanupService } from './custom-logger/log-cleanup.service'
import { EncryptionService } from './encryption/encryption.service'
import { ExternalApiService } from './external-api/external-api.service'
import { SendPulseService } from './sendpulse/sendpulse.service'
import { SendPulseEmailService } from './email-sender/sendpulse-email.service'
import { TwoFactorCacheService } from './two-factor-cache/two-factor-cache.service'

const services = [
  LogCleanupService,
  ExternalApiService,
  TwoFactorCacheService,
  EncryptionService,
  SendPulseService,
  SendPulseEmailService
]
@Global()
@Module({
  imports: [CustomLoggerModule],
  controllers: [],
  providers: services,
  exports: services
})
export class UtilsModuleModule {
  constructor() {
    console.log('[DIAGNOSTIC] UtilsModuleModule: Module initialized')
  }
}
