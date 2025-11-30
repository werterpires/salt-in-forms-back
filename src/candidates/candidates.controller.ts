import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common'
import { CandidatesService } from './candidates.service'
import { IsPublic } from '../shared/auth/decorators/is-public.decorator'
import { SignTermsDto } from './dto/sign-terms.dto'
import { SelfRegisterCandidateDto } from './dto/self-register-candidate.dto'
import { CompleteRegistrationDto } from './dto/complete-registration.dto'
import { ResendConfirmationDto } from './dto/resend-confirmation.dto'
import { AssignInterviewerDto } from './dto/assign-interviewer.dto'
import { UpdateCandidateDto } from './dto/update-candidate.dto'
import { Roles } from '../users/decorators/roles.decorator'
import { ERoles } from '../constants/roles.const'
import { FindAllResponse, Paginator } from '../shared/types/types'
import * as db from '../constants/db-schema.enum'
import { CandidateBasicInfo } from './types'
import { CurrentUser } from '../users/decorators/current-user.decorator'
import { ValidateUser } from '../shared/auth/types'

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

  /**
   * 6.6 - Buscar todos os candidatos de um processo
   * Endpoint protegido para ADMIN e SEC
   */
  @Roles(ERoles.ADMIN, ERoles.SEC)
  @Get('process/:processId')
  async getCandidatesByProcess(
    @Param('processId') processId: string,
    @Query('direction') direction: string,
    @Query('page') page: string,
    @Query('column') column: string
  ): Promise<FindAllResponse<CandidateBasicInfo>> {
    const paginator = new Paginator<typeof db.Candidates>(
      +page,
      direction,
      column,
      db.Candidates.CANDIDATE_NAME,
      db.Candidates
    )

    return await this.candidatesService.getCandidatesByProcess(
      Number(processId),
      paginator
    )
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

  /**
   * 6.7 - Distribuir candidatos entre entrevistadores
   * Endpoint administrativo (ADMIN only) para distribuir candidatos entre entrevistadores ativos
   */
  @Roles(ERoles.ADMIN)
  @Post('distribute-interviewers/:processId')
  async distributeInterviewers(@Param('processId') processId: string) {
    return this.candidatesService.distributeInterviewers(Number(processId))
  }

  /**
   * 6.8 - Atribuir entrevistador a um candidato
   * Endpoint administrativo (ADMIN only) para atribuir um entrevistador específico a um candidato
   */
  @Roles(ERoles.ADMIN)
  @Post('assign-interviewer')
  async assignInterviewer(@Body() dto: AssignInterviewerDto) {
    return this.candidatesService.assignInterviewerToCandidate(
      dto.userId,
      dto.candidateId
    )
  }

  /**
   * 6.9 - Listar candidatos do entrevistador em um processo
   * Endpoint para entrevistadores visualizarem seus candidatos em um processo específico
   */
  @Roles(ERoles.INTERV)
  @Get('interviewer/:processId')
  async getCandidatesByInterviewer(
    @Param('processId') processId: string,
    @CurrentUser() user: ValidateUser
  ) {
    return await this.candidatesService.getCandidatesByInterviewer(
      Number(processId),
      user.userId
    )
  }

  /**
   * 6.10 - Atualizar status de aprovação do candidato
   * Endpoint administrativo (ADMIN only) para aprovar/desaprovar candidatos
   */
  @Roles(ERoles.ADMIN)
  @Put('update-approval')
  async updateCandidateApproval(@Body() dto: UpdateCandidateDto) {
    return this.candidatesService.updateCandidateApproval(
      dto.candidateId,
      dto.approved
    )
  }
}
