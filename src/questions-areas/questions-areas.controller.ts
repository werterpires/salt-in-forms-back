import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Put
} from '@nestjs/common'
import { QuestionsAreasService } from './questions-areas.service'
import { CreateQuestionsAreaDto } from './dto/create-questions-area.dto'
import { UpdateQuestionsAreaDto } from './dto/update-questions-area.dto'
import { Roles } from 'src/users/decorators/roles.decorator'
import { ERoles } from 'src/constants/roles.const'
import { Paginator } from 'src/shared/types/types'
import * as db from 'src/constants/db-schema.enum'
import { QuestionsAreasFilter } from './types'
import { BoolenOrUndefinedPipe } from 'src/shared/pipes/boolen-or-undefined/boolen-or-undefined.pipe'

@Controller('questions-areas')
export class QuestionsAreasController {
  constructor(private readonly questionsAreasService: QuestionsAreasService) {}

  @Roles(ERoles.ADMIN)
  @Post()
  create(@Body() createQuestionsAreaDto: CreateQuestionsAreaDto) {
    return this.questionsAreasService.createQuestionArea(createQuestionsAreaDto)
  }

  @Roles(ERoles.ADMIN)
  @Get()
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('direction') direction: string,
    @Query('column') column: string,
    @Query('questionAreaName') questionAreaName: string,
    @Query('questionAreaActive', BoolenOrUndefinedPipe)
    questionAreaActive: boolean
  ) {
    const paginator = new Paginator<typeof db.QuestionsAreas>(
      page,
      direction,
      column,
      db.QuestionsAreas.QUESTION_AREA_NAME,
      db.QuestionsAreas
    )

    const filters: QuestionsAreasFilter = {
      questionAreaName: questionAreaName || undefined,
      questionAreaActive
    }

    return this.questionsAreasService.findAllQuestionAreas(paginator, filters)
  }

  @Roles(ERoles.ADMIN)
  @Put()
  update(@Body() updateQuestionsAreaDto: UpdateQuestionsAreaDto) {
    return this.questionsAreasService.updateQuestionArea(updateQuestionsAreaDto)
  }

  @Roles(ERoles.ADMIN)
  @Delete(':questionAreaId')
  remove(@Param('questionAreaId', ParseIntPipe) questionAreaId: number) {
    return this.questionsAreasService.deleteQuestionArea(questionAreaId)
  }
}
