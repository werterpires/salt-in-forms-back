import { Module } from '@nestjs/common'
import { ScoresController } from './scores.controller'
import { ScoresService } from './scores.service'
import { ScoresRepo } from './scores.repo'
import { QuestionsModule } from '../questions/questions.module'

@Module({
  imports: [QuestionsModule],
  controllers: [ScoresController],
  providers: [ScoresService, ScoresRepo]
})
export class ScoresModule {}
