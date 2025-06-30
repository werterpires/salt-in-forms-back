
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Put,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
import { QuestionsService } from './questions.service'
import { CreateQuestionDto } from './dto/create-question.dto'
import { UpdateQuestionDto } from './dto/update-question.dto'
import { ReorderQuestionsDto } from './dto/reorder-questions.dto'
import { Roles } from 'src/users/decorators/roles.decorator'
import { ERoles } from 'src/constants/roles.const'

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Roles(ERoles.ADMIN)
  @Post()
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto)
  }

  @Roles(ERoles.ADMIN)
  @Get('by-section/:formSectionId')
  findAllByFormSectionId(@Param('formSectionId', ParseIntPipe) formSectionId: number) {
    return this.questionsService.findAllByFormSectionId(formSectionId)
  }

  @Roles(ERoles.ADMIN)
  @Put()
  update(@Body() updateQuestionDto: UpdateQuestionDto) {
    return this.questionsService.update(updateQuestionDto)
  }

  @Roles(ERoles.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':questionId')
  remove(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.questionsService.remove(questionId)
  }

  @Roles(ERoles.ADMIN)
  @Put('reorder')
  reorder(@Body() reorderQuestionsDto: ReorderQuestionsDto) {
    return this.questionsService.reorder(reorderQuestionsDto)
  }
}
