import { Module } from '@nestjs/common'
import { UtilsModuleModule } from './shared/utils-module/utils-module.module'
import { APP_FILTER } from '@nestjs/core'
import { GlobalErrorsFilter } from './shared/custom-error-handler/global-errors.filter'
import { CustomErrorHandlerService } from './shared/custom-error-handler/custom-error-handler.service'

@Module({
  imports: [UtilsModuleModule],
  controllers: [],
  providers: [
    CustomErrorHandlerService,
    { provide: APP_FILTER, useClass: GlobalErrorsFilter }
  ]
})
export class AppModule {}
