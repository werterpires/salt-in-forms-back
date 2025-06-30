
import { Injectable } from '@nestjs/common'
import { QuestionsRepo } from './questions.repo'
import { FormSectionsRepo } from '../form-sections/form-sections.repo'
import { CreateQuestionDto } from './dto/create-question.dto'
import { UpdateQuestionDto } from './dto/update-question.dto'
import { ReorderQuestionsDto } from './dto/reorder-questions.dto'
import { Question } from './types'
import { QuestionsHelper } from './questions.helper'

@Injectable()
export class QuestionsService {
  constructor(
    private readonly questionsRepo: QuestionsRepo,
    private readonly formSectionsRepo: FormSectionsRepo
  ) {}

  async findAllByFormSectionId(formSectionId: number): Promise<Question[]> {
    const questions = await this.questionsRepo.findAllByFormSectionId(formSectionId)
    return QuestionsHelper.sortQuestionsByOrder(questions)
  }

  async create(createQuestionDto: CreateQuestionDto): Promise<void> {
    const createQuestion = await QuestionsHelper.processCreateQuestion(
      createQuestionDto,
      this.questionsRepo,
      this.formSectionsRepo
    )
    return this.questionsRepo.createQuestionWithReorder(createQuestion)
  }

  async update(updateQuestionDto: UpdateQuestionDto): Promise<void> {
    const updateQuestion = QuestionsHelper.mapUpdateDtoToEntity(updateQuestionDto)
    return this.questionsRepo.updateQuestion(updateQuestion)
  }

  async remove(questionId: number): Promise<void> {
    return this.questionsRepo.deleteQuestion(questionId)
  }

  async reorder(reorderQuestionsDto: ReorderQuestionsDto): Promise<void> {
    await QuestionsHelper.validateReorderData(
      reorderQuestionsDto.questions,
      this.questionsRepo
    )
    return this.questionsRepo.reorderQuestions(reorderQuestionsDto.questions)
  }
}
