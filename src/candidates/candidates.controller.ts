import { Controller, Get, Param } from '@nestjs/common'
import { CandidatesService } from './candidates.service'
import { IsPublic } from '../shared/auth/decorators/is-public.decorator'

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @IsPublic()
  @Get(':uniqueCode')
  async validateAccessCode(@Param('uniqueCode') uniqueCode: string) {
    return this.candidatesService.validateAccessCode(uniqueCode)
  }
}
