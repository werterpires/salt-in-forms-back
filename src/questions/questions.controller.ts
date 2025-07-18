import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Delete,
  Patch
} from '@nestjs/common'
import { QuestionsService } from './questions.service'

import { Question } from './types'
import { CreateQuestionDto } from './dto/create-question.dto'
import { UpdateQuestionDto } from './dto/update-question.dto'
import { ReorderQuestionsDto } from './dto/reorder-questions.dto'

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  async create(@Body() createQuestionDto: CreateQuestionDto): Promise<void> {
    return this.questionsService.create(createQuestionDto)
  }

  @Get('section/:formSectionId')
  async findAllBySectionId(
    @Param('formSectionId', ParseIntPipe) formSectionId: number
  ): Promise<Question[]> {
    return this.questionsService.findAllBySectionId(formSectionId)
  }

  @Get('quantity/:sectionId')
  async getNumberOfQuestionsFromPreviousSections(
    @Param('sectionId', ParseIntPipe) sectionId: number
  ): Promise<number> {
    return this.questionsService.getNumberOfQuestionsFromPreviousSections(
      sectionId
    )
  }

  @Put()
  async update(@Body() updateQuestionDto: UpdateQuestionDto): Promise<void> {
    return this.questionsService.update(updateQuestionDto)
  }

  @Delete(':questionId')
  async delete(
    @Param('questionId', ParseIntPipe) questionId: number
  ): Promise<void> {
    return this.questionsService.delete(questionId)
  }

  @Patch('reorder')
  async reorder(
    @Body() reorderQuestionsDto: ReorderQuestionsDto
  ): Promise<void> {
    return this.questionsService.reorder(reorderQuestionsDto)
  }
}
