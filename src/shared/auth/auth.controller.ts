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
import { AuthService } from './auth.service'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { AuthRequest } from './types'
import { LogonDto } from './dtos/logon.dto'
import { IsPublic } from './decorators/is-public.decorator'
import { LoginDto } from './dtos/login.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @IsPublic()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  login(@Request() req: AuthRequest, @Body() loginDto: LoginDto) {
    if (!loginDto.termsIds) {
      loginDto.termsIds = []
    }
    return this.authService.login(req.user, loginDto.termsIds)
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
}
