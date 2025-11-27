import { Controller, Get, Param, Patch, Body } from '@nestjs/common'
import { RatesService } from './rates.service'
import { Roles } from '../users/decorators/roles.decorator'
import { ERoles } from '../constants/roles.const'
import { CurrentUser } from '../users/decorators/current-user.decorator'
import { ValidateUser } from '../shared/auth/types'
import { InterviewData } from './types'
import { UpdateAnswerCommentDto } from './dto/update-answer-comment.dto'

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
