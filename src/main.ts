import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { CustomLoggerService } from './shared/utils-module/custom-logger/custom-logger.service'
import { ValidationPipe } from '@nestjs/common'
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface'

const corsOptions: CorsOptions = {
  origin: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: corsOptions
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )
  app.useLogger(new CustomLoggerService())
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
