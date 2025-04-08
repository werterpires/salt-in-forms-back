import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { CustomLoggerService } from './shared/utils-module/custom-logger/custom-logger.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true
  })
  app.useLogger(new CustomLoggerService())
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
