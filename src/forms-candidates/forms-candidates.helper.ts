
import { CreateAnswer } from '../answers/types'
import { CreateAnswerDto } from '../answers/dto/create-answer.dto'

/**
 * Transforma CreateAnswerDto em CreateAnswer
 */
export function transformCreateAnswerDto(
  createAnswerDto: CreateAnswerDto,
  formCandidateId: number
): CreateAnswer {
  return {
    questionId: createAnswerDto.questionId,
    formCandidateId: formCandidateId,
    answerValue: createAnswerDto.answerValue,
    validAnswer: true
  }
}
