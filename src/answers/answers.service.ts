import { Injectable } from '@nestjs/common'
import { AnswersRepo } from './answers.repo'
import { CreateAnswerDto } from './dto/create-answer.dto'
import { FormsCandidatesService } from '../forms-candidates/forms-candidates.service'
import { transformCreateAnswerDto } from '../forms-candidates/forms-candidates.helper'
import { Answer, CreateAnswer } from './types'

@Injectable()
export class AnswersService {
  constructor(
    private readonly answersRepo: AnswersRepo,
    private readonly formsCandidatesService: FormsCandidatesService
  ) {}

  async createAnswer(createAnswerDto: CreateAnswerDto): Promise<number> {
    const formCandidateId: number =
      await this.formsCandidatesService.validateAccessCodeAndGetFormCandidateId(
        createAnswerDto.accessCode
      )

    const existingAnswer: Answer | undefined =
      await this.answersRepo.findAnswerByQuestionAndFormCandidate(
        createAnswerDto.questionId,
        formCandidateId
      )

    if (!existingAnswer) {
      const answerData: CreateAnswer = transformCreateAnswerDto(
        createAnswerDto,
        formCandidateId
      )
      return await this.answersRepo.insertAnswer(answerData)
    }

    if (!existingAnswer.validAnswer) {
      throw new Error(
        '#Essa pergunta não está habilitada para o candidato atual.'
      )
    }

    await this.answersRepo.updateAnswerValue(
      existingAnswer.answerId,
      createAnswerDto.answerValue
    )

    return existingAnswer.answerId
  }
}