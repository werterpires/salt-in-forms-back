import { Global, Module } from '@nestjs/common'
import { CustomLoggerService } from './custom-logger/custom-logger.service'
import { EncryptionService } from './encryption/encryption.service'
import { ExternalApiService } from './external-api/external-api.service'
import { SendPulseService } from './sendpulse/sendpulse.service'

const services = [
  CustomLoggerService,
  EncryptionService,
  ExternalApiService,
  SendPulseService
]
@Global()
@Module({
  controllers: [],
  providers: services,
  exports: services
})
export class UtilsModuleModule {}
