import {
  Body,
  Controller,
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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  login(@Request() req: AuthRequest) {
    return this.authService.login(req.user)
  }

  @Post('logon/:invitationCode')
  logon(
    @Param('invitationCode') invitationCode: string,
    @Body() body: LogonDto
  ) {
    return this.authService.logon(invitationCode, body)
  }
}
