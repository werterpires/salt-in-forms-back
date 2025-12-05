import { Controller, Get, Param, Patch, Body, Post } from '@nestjs/common'
import { RatesService } from './rates.service'
import { Roles } from '../users/decorators/roles.decorator'
import { ERoles } from '../constants/roles.const'
import { CurrentUser } from '../users/decorators/current-user.decorator'
import { ValidateUser } from '../shared/auth/types'
import { InterviewData, Rate } from './types'
import { UpdateAnswerCommentDto } from './dto/update-answer-comment.dto'
import { CreateRateDto } from './dto/create-rate.dto'
import { UpdateRateDto } from './dto/update-rate.dto'

@Controller('rates')
export class RatesController {
  constructor(private readonly ratesService: RatesService) {}

  /**
   * Busca dados completos de entrevista para um candidato
   * Endpoint protegido para entrevistadores
   * Verifica se o candidato pertence ao entrevistador atual
   */
  @Roles(ERoles.INTERV)
  @Get('interview/:candidateId')
  async getInterviewData(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: ValidateUser
  ): Promise<InterviewData> {
    return await this.ratesService.getInterviewDataForCandidate(
      Number(candidateId),
      user.userId
    )
  }

  /**
   * Busca todos os rates de um entrevistador para um candidato específico
   * Endpoint protegido para entrevistadores
   * Verifica se o candidato pertence ao entrevistador atual
   */
  @Roles(ERoles.INTERV)
  @Get('candidate/:candidateId')
  async getRatesForCandidate(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: ValidateUser
  ): Promise<Rate[]> {
    return await this.ratesService.getRatesForCandidate(
      Number(candidateId),
      user.userId
    )
  }

  /**
   * Cria um novo rate (avaliação)
   * Endpoint protegido para entrevistadores
   * Verifica se o candidato pertence ao entrevistador atual
   * Verifica se a data final do processo não passou
   */
  @Roles(ERoles.INTERV)
  @Post()
  async createRate(
    @Body() createRateDto: CreateRateDto,
    @CurrentUser() user: ValidateUser
  ): Promise<{ message: string; rateId: number }> {
    const rateId = await this.ratesService.createRate(
      createRateDto.candidateId,
      createRateDto.questionAreaId,
      createRateDto.rateValue,
      createRateDto.rateComment,
      user.userId
    )
    return { message: 'Avaliação criada com sucesso', rateId }
  }

  /**
   * Atualiza um rate existente (apenas nota e comentário)
   * Endpoint protegido para entrevistadores
   * Verifica se o rate pertence ao entrevistador atual
   * Verifica se a data final do processo não passou
   */
  @Roles(ERoles.INTERV)
  @Patch()
  async updateRate(
    @Body() updateRateDto: UpdateRateDto,
    @CurrentUser() user: ValidateUser
  ): Promise<{ message: string }> {
    await this.ratesService.updateRate(
      updateRateDto.rateId,
      updateRateDto.rateValue,
      updateRateDto.rateComment,
      user.userId
    )
    return { message: 'Avaliação atualizada com sucesso' }
  }

  /**
   * Atualiza o comentário de uma resposta
   * Endpoint protegido para entrevistadores
   * Verifica se a resposta pertence a um candidato do entrevistador atual
   */
  @Roles(ERoles.INTERV)
  @Patch('answer/:answerId/comment')
  async updateAnswerComment(
    @Param('answerId') answerId: string,
    @Body() updateAnswerCommentDto: UpdateAnswerCommentDto,
    @CurrentUser() user: ValidateUser
  ): Promise<{ message: string }> {
    await this.ratesService.updateAnswerComment(
      Number(answerId),
      updateAnswerCommentDto.answerComment,
      user.userId
    )
    return { message: 'Comentário salvo com sucesso' }
  }
}
