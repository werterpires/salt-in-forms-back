import { Controller, Post, Delete, Body, Param } from '@nestjs/common'
import { ScoresService } from './scores.service'
import { CreateScoreDto } from './dto/create-score.dto'

@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post()
  async create(@Body() createScoreDto: CreateScoreDto): Promise<void> {
    return this.scoresService.create(createScoreDto)
  }

  @Delete(':questionId')
  async remove(@Param('questionId') questionId: string): Promise<void> {
    return this.scoresService.delete(+questionId)
  }
}
