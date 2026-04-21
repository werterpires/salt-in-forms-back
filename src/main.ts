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
  console.log('[DIAGNOSTIC] main.ts: Starting bootstrap function')
  try {
    console.log('[DIAGNOSTIC] main.ts: Creating NestFactory...')
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
      cors: corsOptions
    })
    console.log('[DIAGNOSTIC] main.ts: NestFactory created successfully')

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    )
    console.log('[DIAGNOSTIC] main.ts: Global pipes configured')

    console.log(
      '[DIAGNOSTIC] main.ts: Creating CustomLoggerService instance...'
    )
    app.useLogger(new CustomLoggerService())
    console.log('[DIAGNOSTIC] main.ts: Logger configured')

    const port = process.env.PORT ?? 3000
    await app.listen(port)
    console.log(`[DIAGNOSTIC] main.ts: Application listening on port ${port}`)
  } catch (error) {
    console.error('[DIAGNOSTIC] main.ts: Bootstrap failed with error:', error)
    throw error
  }
}
bootstrap().catch((err) => {
  console.error('[DIAGNOSTIC] main.ts: Fatal error during bootstrap:', err)
  process.exit(1)
})
