import { Controller, Get, Param } from '@nestjs/common'
import { RatesService } from './rates.service'
import { Roles } from '../users/decorators/roles.decorator'
import { ERoles } from '../constants/roles.const'
import { CurrentUser } from '../users/decorators/current-user.decorator'
import { ValidateUser } from '../shared/auth/types'
import { InterviewData } from './types'

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
}
