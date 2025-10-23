import { Controller, Post, Body } from '@nestjs/common'
import { AnswersService } from './answers.service'
import { CreateAnswerDto } from './dto/create-answer.dto'
import { IsPublic } from '../shared/auth/decorators/is-public.decorator'

@Controller('answers')
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @IsPublic()
  @Post()
  async createAnswer(@Body() createAnswerDto: CreateAnswerDto) {
    const answerId = await this.answersService.createAnswer(createAnswerDto)
    return { answerId }
  }
}
