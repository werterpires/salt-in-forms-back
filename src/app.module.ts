import { Module } from '@nestjs/common'
import { UtilsModuleModule } from './shared/utils-module/utils-module.module'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { GlobalErrorsFilter } from './shared/custom-error-handler/global-errors.filter'
import { CustomErrorHandlerService } from './shared/custom-error-handler/custom-error-handler.service'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'

const throttler = ThrottlerModule.forRoot({
  throttlers: [
    {
      ttl: 60000,
      limit: 30
    }
  ]
})

@Module({
  imports: [UtilsModuleModule, throttler],
  controllers: [],
  providers: [
    CustomErrorHandlerService,
    { provide: APP_FILTER, useClass: GlobalErrorsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard }
  ]
})
export class AppModule {}
