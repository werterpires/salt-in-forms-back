import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { LoginValidationMiddleware } from './middlewares/login-validation.middleware'
import { JwtModule } from '@nestjs/jwt'
import { AuthRepo } from './auth.repo'

const jwtModule = JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '12h' }
})

const services = [AuthService, AuthRepo]

@Module({
  imports: [jwtModule],
  controllers: [AuthController],
  providers: services
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoginValidationMiddleware).forRoutes('auth/login')
  }
}
