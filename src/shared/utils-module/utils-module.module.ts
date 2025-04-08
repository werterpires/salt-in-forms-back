import { Global, Module } from '@nestjs/common'
import { CustomLoggerService } from './custom-logger/custom-logger.service'

const services = [CustomLoggerService]
@Global()
@Module({
  controllers: [],
  providers: services,
  exports: services
})
export class UtilsModuleModule {}
