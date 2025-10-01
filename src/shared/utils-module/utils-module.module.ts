import { Global, Module } from '@nestjs/common'
import { CustomLoggerService } from './custom-logger/custom-logger.service'
import { EncryptionService } from './encryption/encryption.service'
import { ExternalApiService } from './external-api/external-api.service'

const services = [CustomLoggerService, EncryptionService, ExternalApiService]
@Global()
@Module({
  controllers: [],
  providers: services,
  exports: services
})
export class UtilsModuleModule {}
