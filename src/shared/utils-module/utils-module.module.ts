import { Global, Module } from '@nestjs/common'
import { CustomLoggerService } from './custom-logger/custom-logger.service'
import { EncryptionService } from './encryption/encryption.service'
import { ExternalApiService } from './external-api/external-api.service'
import { SendPulseService } from './sendpulse/sendpulse.service'
import { SendPulseEmailService } from './email-sender/sendpulse-email.service'
import { TwoFactorCacheService } from './two-factor-cache/two-factor-cache.service'

const services = [
  CustomLoggerService,
  EncryptionService,
  ExternalApiService,
  SendPulseService,
  SendPulseEmailService,
  TwoFactorCacheService
]
@Global()
@Module({
  controllers: [],
  providers: services,
  exports: services
})
export class UtilsModuleModule {}
