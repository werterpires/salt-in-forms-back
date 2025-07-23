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

    const questionId = await this.questionsRepo.create(createQuestionData)

    if (
      createQuestionDto.questionOptions &&
      createQuestionDto.questionOptions.length > 0
    ) {
      const questionOptions = createQuestionDto.questionOptions.map(
        (option) => ({
          questionId,
          questionOptionType: option.questionOptionType,
          questionOptionValue: option.questionOptionValue
        })
      )
      await this.questionsRepo.createQuestionOptions(questionOptions)
    }
  }

  async findAllBySectionId(formSectionId: number): Promise<Question[]> {
    return this.questionsRepo.findAllBySectionId(formSectionId)
  }

  async update(updateQuestionDto: UpdateQuestionDto): Promise<void> {
    const updateQuestionData = await QuestionsHelper.transformUpdateDto(
      updateQuestionDto,
      this.questionsRepo
    )

    // e) ao editar, rodar uma query que apaga todas as options daquela question
    await this.questionsRepo.deleteQuestionOptions(updateQuestionDto.questionId)

    await this.questionsRepo.updateQuestion(updateQuestionData)

    if (
      updateQuestionDto.questionOptions &&
      updateQuestionDto.questionOptions.length > 0
    ) {
      const questionOptions = updateQuestionDto.questionOptions.map(
        (option) => ({
          questionId: updateQuestionDto.questionId,
          questionOptionType: option.questionOptionType,
          questionOptionValue: option.questionOptionValue
        })
      )
      await this.questionsRepo.createQuestionOptions(questionOptions)
    }
  }

  async delete(questionId: number): Promise<void> {
    // f) ao deletar uma question, deletar suas options junto
    await this.questionsRepo.deleteQuestionOptions(questionId)
    await this.questionsRepo.deleteQuestion(questionId)
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
