import { Controller, Get, Post, Param, Body } from '@nestjs/common'
import { CandidatesService } from './candidates.service'
import { IsPublic } from '../shared/auth/decorators/is-public.decorator'
import { SignTermsDto } from './dto/sign-terms.dto'
import { SelfRegisterCandidateDto } from './dto/self-register-candidate.dto'
import { CompleteRegistrationDto } from './dto/complete-registration.dto'
import { ResendConfirmationDto } from './dto/resend-confirmation.dto'
import { Roles } from '../users/decorators/roles.decorator'
import { ERoles } from '../constants/roles.const'

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  /**
   * 6.1 - Auto-cadastro de candidato
   * Endpoint público para candidatos se cadastrarem com orderCode
   */
  @IsPublic()
  @Post('self-register')
  async selfRegister(@Body() dto: SelfRegisterCandidateDto) {
    return this.candidatesService.selfRegisterCandidate(dto)
  }

  /**
   * 6.2 - Confirmar cadastro via token
   * Endpoint público para confirmar email (não completa o cadastro)
   */
  @IsPublic()
  @Get('confirm-registration/:token')
  async confirmRegistration(@Param('token') token: string) {
    return this.candidatesService.confirmRegistration(token)
  }

  /**
   * 6.3 - Completar cadastro após confirmação de email
   * Endpoint público para fornecer dados adicionais do candidato
   */
  @IsPublic()
  @Post('complete-registration/:token')
  async completeRegistration(
    @Param('token') token: string,
    @Body() dto: CompleteRegistrationDto
  ) {
    return await this.candidatesService.completeRegistration(token, dto)
  }

  /**
   * 6.4 - Reenviar email de confirmação
   * Endpoint público para reenviar email com mesmo token
   */
  @IsPublic()
  @Post('resend-confirmation')
  async resendConfirmation(@Body() dto: ResendConfirmationDto) {
    return this.candidatesService.resendConfirmation(dto)
  }

  /**
   * 6.5 - Verificar status de cadastro (admin only - debug)
   * Endpoint administrativo para verificar status de um orderCode
   */
  @Roles(ERoles.ADMIN, ERoles.SEC)
  @Get('registration-status/:orderCode')
  async getRegistrationStatus(@Param('orderCode') orderCode: string) {
    return this.candidatesService.getRegistrationStatus(orderCode)
  }

  @IsPublic()
  @Get(':uniqueCode')
  async validateAccessCode(@Param('uniqueCode') uniqueCode: string) {
    return this.candidatesService.validateAccessCode(uniqueCode)
  }

  @IsPublic()
  @Post('sign-terms/:uniqueCode')
  async signTerms(
    @Param('uniqueCode') uniqueCode: string,
    @Body() signTermsDto: SignTermsDto
  ) {
    return this.candidatesService.signTerms(uniqueCode, signTermsDto)
  }
}
