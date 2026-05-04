import { Controller, Put, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { FormsCandidatesService } from './forms-candidates.service'
import { SubmitFormDto } from './dto/submit-form.dto'
import { IsPublic } from 'src/shared/auth/decorators/is-public.decorator'

@Controller('forms-candidates')
export class FormsCandidatesController {
  constructor(
    private readonly formsCandidatesService: FormsCandidatesService
  ) {}

  @IsPublic()
  @Put('submit')
  @HttpCode(HttpStatus.OK)
  async submitForm(@Body() submitFormDto: SubmitFormDto): Promise<void> {
    await this.formsCandidatesService.submitForm(submitFormDto.accessCode)
  }
}
