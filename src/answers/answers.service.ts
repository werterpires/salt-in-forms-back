import { Injectable } from '@nestjs/common'
import { AnswersRepo } from './answers.repo'
import { CreateAnswerDto } from './dto/create-answer.dto'
import { FormsCandidatesService } from '../forms-candidates/forms-candidates.service'
import { transformCreateAnswerDto } from '../forms-candidates/forms-candidates.helper'
import { Answer, CreateAnswer } from './types'
import { AnswersHelper } from './answers.helper'
import { QuestionsRepo } from '../questions/questions.repo'
import { Question, Validation } from '../questions/types'

@Injectable()
export class AnswersService {
  constructor(
    private readonly answersRepo: AnswersRepo,
    private readonly formsCandidatesService: FormsCandidatesService,
    private readonly questionsRepo: QuestionsRepo
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

    const question: Question | null = await this.questionsRepo.findById(
      createAnswerDto.questionId
    )

    if (!question) {
      throw new Error('#Pergunta não encontrada.')
    }

    const questionValidations: Validation[] =
      await this.questionsRepo.findValidationsByQuestionId(question.questionId)

    const validValidations: Validation[] =
      AnswersHelper.filterValidValidations(
        questionValidations,
        question.questionType
      )

    AnswersHelper.validateAnswer(createAnswerDto.answerValue, validValidations)

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
