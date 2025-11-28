import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { AuthRequest } from './types'
import { LogonDto } from './dtos/logon.dto'
import { IsPublic } from './decorators/is-public.decorator'
import { Verify2FADto } from './dtos/verify-2fa.dto'
import { Resend2FADto } from './dtos/resend-2fa.dto'
import { ForgotPasswordDto } from './dtos/forgot-password.dto'
import { ResetPasswordDto } from './dtos/reset-password.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @IsPublic()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  login(@Request() req: AuthRequest) {
    return this.authService.login(req.user)
  }

  @IsPublic()
  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  async verify2FA(@Body() verify2FADto: Verify2FADto) {
    if (!verify2FADto.termsIds) {
      verify2FADto.termsIds = []
    }
    return await this.authService.verify2FA(
      verify2FADto.userEmail,
      verify2FADto.code,
      verify2FADto.termsIds
    )
  }

  @IsPublic()
  @Post('resend-2fa')
  @HttpCode(HttpStatus.OK)
  async resend2FA(@Body() resend2FADto: Resend2FADto) {
    await this.authService.resend2FA(resend2FADto.userEmail)
    return { message: 'Código reenviado com sucesso.' }
  }

  @IsPublic()
  @Post('policies')
  @UseGuards(LocalAuthGuard)
  async getPolicies(@Request() req: AuthRequest) {
    return await this.authService.getPolicies(req.user)
  }

  @IsPublic()
  @Post('logon/:invitationCode')
  logon(
    @Param('invitationCode') invitationCode: string,
    @Body() body: LogonDto
  ) {
    return this.authService.logon(invitationCode, body)
  }

  @IsPublic()
  @Get('logon/:invitationCode')
  async getNewUserToLogon(@Param('invitationCode') invitationCode: string) {
    return await this.authService.getNewUserToLogon(invitationCode)
  }

  @IsPublic()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.userEmail)
    return {
      message:
        'Se o email estiver correto, um código de recuperação foi enviado.'
    }
  }

  @IsPublic()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.userEmail,
      resetPasswordDto.code,
      resetPasswordDto.newPassword
    )
    return {
      message:
        'Senha redefinida com sucesso. Sua conta foi desativada por segurança. Entre em contato com um administrador para reativação.'
    }
  }
}
