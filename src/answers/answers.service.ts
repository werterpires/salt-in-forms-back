import { Injectable } from '@nestjs/common'
import { AnswersRepo } from './answers.repo'
import { CreateAnswerDto } from './dto/create-answer.dto'
import { FormsCandidatesService } from '../forms-candidates/forms-candidates.service'
import { transformCreateAnswerDto } from '../forms-candidates/forms-candidates.helper'
import { Answer, CreateAnswer } from './types'

@Injectable()
export class AnswersService {
  openAnswerValidValidationsTypes = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 19, 20, 21, 22, 23, 24
  ]

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

    if (existingAnswer && !existingAnswer.validAnswer) {
      throw new Error(
        '#Essa pergunta não está habilitada para o candidato atual.'
      )
    }

    //TO DO: validações

    if (!existingAnswer) {
      const answerData: CreateAnswer = transformCreateAnswerDto(
        createAnswerDto,
        formCandidateId
      )
      return await this.answersRepo.insertAnswer(answerData)
    }

    await this.answersRepo.updateAnswerValue(
      existingAnswer.answerId,
      createAnswerDto.answerValue
    )

    return existingAnswer.answerId
  }
}
