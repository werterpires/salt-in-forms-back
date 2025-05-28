import { Injectable } from '@nestjs/common'
import { CreateQuestionsAreaDto } from './dto/create-questions-area.dto'
import { UpdateQuestionsAreaDto } from './dto/update-questions-area.dto'
import { QuestionsAreasRepo } from './questions-areas.repo'
import { FindAllResponse, Paginator } from 'src/shared/types/types'
import { QuestionArea } from './types'
import * as db from 'src/constants/db-schema.enum'

@Injectable()
export class QuestionsAreasService {
  constructor(private readonly questionsAreasRepo: QuestionsAreasRepo) {}

  async createQuestionArea(createQuestionsAreaDto: CreateQuestionsAreaDto) {
    return this.questionsAreasRepo.createQuestionArea(createQuestionsAreaDto)
  }

  async findAllQuestionAreas(
    orderBy: Paginator<typeof db.QuestionsAreas>,
    filters: any
  ): Promise<FindAllResponse<QuestionArea>> {
    const questionAreas = await this.questionsAreasRepo.findAllQuestionAreas(
      orderBy,
      filters
    )
    const questionAreasQuantity =
      await this.questionsAreasRepo.findQuestionsAreasQuantity(filters)

    const response: FindAllResponse<QuestionArea> = {
      data: questionAreas,
      pagesQuantity: questionAreasQuantity
    }

    return response
  }

  async updateQuestionArea(updateQuestionsAreaDto: UpdateQuestionsAreaDto) {
    return this.questionsAreasRepo.updateQuestionArea(updateQuestionsAreaDto)
  }

  async deleteQuestionArea(questionAreaId: number) {
    return this.questionsAreasRepo.deleteQuestionArea(questionAreaId)
  }
}
