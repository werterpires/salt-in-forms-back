import { Controller, Get, Post, Param, Body } from '@nestjs/common'
import { CandidatesService } from './candidates.service'
import { IsPublic } from '../shared/auth/decorators/is-public.decorator'
import { SignTermsDto } from './dto/sign-terms.dto'

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

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
