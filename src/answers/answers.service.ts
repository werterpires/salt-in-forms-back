import { Injectable } from '@nestjs/common'
import { AnswersRepo } from './answers.repo'
import { CreateAnswerDto } from './dto/create-answer.dto'
import { FormsCandidatesService } from '../forms-candidates/forms-candidates.service'
import { transformCreateAnswerDto } from '../forms-candidates/forms-candidates.helper'

@Injectable()
export class AnswersService {
  constructor(
    private readonly answersRepo: AnswersRepo,
    private readonly formsCandidatesService: FormsCandidatesService
  ) {}

  async createAnswer(createAnswerDto: CreateAnswerDto): Promise<number> {
    const formCandidateId =
      await this.formsCandidatesService.validateAccessCodeAndGetFormCandidateId(
        createAnswerDto.accessCode
      )

    const answerData = transformCreateAnswerDto(
      createAnswerDto,
      formCandidateId
    )

    return await this.answersRepo.insertAnswer(answerData)
  }
}