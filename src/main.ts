import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { CustomLoggerService } from './shared/custom-logger/custom-logger.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLoggerService()
  })
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
