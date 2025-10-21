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

    // Verificar se já existe uma resposta para esta questão e formCandidate
    const existingAnswer =
      await this.answersRepo.findAnswerByQuestionAndFormCandidate(
        createAnswerDto.questionId,
        formCandidateId
      )

    // Se não existe, inserir nova resposta
    if (!existingAnswer) {
      const answerData = transformCreateAnswerDto(
        createAnswerDto,
        formCandidateId
      )
      return await this.answersRepo.insertAnswer(answerData)
    }

    // Se existe mas validAnswer é false, lançar erro
    if (!existingAnswer.validAnswer) {
      throw new Error(
        '#Essa pergunta não está habilitada para o candidato atual.'
      )
    }

    // Se existe e validAnswer é true, atualizar o answerValue
    await this.answersRepo.updateAnswerValue(
      existingAnswer.answerId,
      createAnswerDto.answerValue
    )

    return existingAnswer.answerId
  }
}