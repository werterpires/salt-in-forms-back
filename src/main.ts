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
  try {
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

    const port = process.env.PORT ?? 3000
    await app.listen(port)
  } catch (error) {
    console.error('[DIAGNOSTIC] main.ts: Bootstrap failed with error:', error)
    throw error
  }
}
bootstrap().catch((err) => {
  console.error('[DIAGNOSTIC] main.ts: Fatal error during bootstrap:', err)
  process.exit(1)
})
