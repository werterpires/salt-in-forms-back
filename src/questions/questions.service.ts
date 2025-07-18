import { Injectable } from '@nestjs/common'
import { QuestionsRepo } from './questions.repo'
import { QuestionsHelper } from './questions.helper'
import { Question } from './types'
import { CreateQuestionDto } from './dto/create-question.dto'
import { UpdateQuestionDto } from './dto/update-question.dto'
import { ReorderQuestionsDto } from './dto/reorder-questions.dto'

@Injectable()
export class QuestionsService {
  constructor(private readonly questionsRepo: QuestionsRepo) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<void> {
    const createQuestionData = await QuestionsHelper.transformCreateDto(
      createQuestionDto,
      this.questionsRepo
    )
    return this.questionsRepo.createQuestion(createQuestionData)
  }

  async findAllBySectionId(formSectionId: number): Promise<Question[]> {
    return this.questionsRepo.findAllBySectionId(formSectionId)
  }

  async update(updateQuestionDto: UpdateQuestionDto): Promise<void> {
    const updateQuestionData = await QuestionsHelper.transformUpdateDto(
      updateQuestionDto,
      this.questionsRepo
    )
    return this.questionsRepo.updateQuestion(updateQuestionData)
  }

  async delete(questionId: number): Promise<void> {
    return this.questionsRepo.deleteQuestion(questionId)
  }

  async reorder(reorderQuestionsDto: ReorderQuestionsDto): Promise<void> {
    await QuestionsHelper.validateReorderData(
      reorderQuestionsDto.questions,
      this.questionsRepo
    )
    return this.questionsRepo.reorderQuestions(reorderQuestionsDto.questions)
  }

  async getNumberOfQuestionsFromPreviousSections(
    formSectionId: number
  ): Promise<number> {
    return this.questionsRepo.getNumberOfQuestionsFromPreviousSections(
      formSectionId
    )
  }
}
