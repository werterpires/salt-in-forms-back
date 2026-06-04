import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { CreateScoreDto } from './dto/create-score.dto'
import { ScoresRepo } from './scores.repo'
import { QuestionsRepo } from '../questions/questions.repo'
import { EScoreType } from '../constants/score-types.enum'
import { EQuestionsTypes } from '../constants/questions-types.enum'

const OPTION_BASED_TYPES = [
  EQuestionsTypes.SINGLE_CHOICE,
  EQuestionsTypes.MULTIPLE_CHOICE
]
const DATE_BASED_TYPES = [EQuestionsTypes.DATE]

@Injectable()
export class ScoresService {
  constructor(
    private readonly scoresRepo: ScoresRepo,
    private readonly questionsRepo: QuestionsRepo
  ) {}

  async create(dto: CreateScoreDto): Promise<void> {
    const question = await this.questionsRepo.findById(dto.questionId)

    if (!question) {
      throw new NotFoundException(
        `#Pergunta com ID ${dto.questionId} não encontrada.`
      )
    }

    const questionType: EQuestionsTypes = question.questionType

    if (dto.scoreType === EScoreType.OPTION_BASED) {
      if (!OPTION_BASED_TYPES.includes(questionType)) {
        throw new BadRequestException(
          '#Pontuação baseada em opções só pode ser aplicada a perguntas de escolha única ou múltipla.'
        )
      }

      const options = await this.questionsRepo.findQuestionOptionsByQuestionId(
        dto.questionId
      )
      const validValues = new Set(options.map((o) => o.questionOptionValue))
      const invalidKeys = Object.keys(dto.optionScoresJson!).filter(
        (key) => !validValues.has(key)
      )

      if (invalidKeys.length > 0) {
        throw new BadRequestException(
          `#As seguintes opções não pertencem à pergunta: ${invalidKeys.join(', ')}.`
        )
      }
    } else if (dto.scoreType === EScoreType.DATE_BASED) {
      if (!DATE_BASED_TYPES.includes(questionType)) {
        throw new BadRequestException(
          '#Pontuação baseada em data só pode ser aplicada a perguntas do tipo data.'
        )
      }
    }

    await this.scoresRepo.upsertScore({
      questionId: dto.questionId,
      scoreType: dto.scoreType,
      optionScoresJson: dto.optionScoresJson ?? null,
      dateComparisonType: dto.dateComparisonType ?? null,
      cutoffDate: dto.cutoffDate ?? null,
      dateScore: dto.dateScore ?? null
    })
  }

  async delete(questionId: number): Promise<void> {
    const score = await this.scoresRepo.findByQuestionId(questionId)

    if (!score) {
      throw new NotFoundException(
        `#Nenhum score encontrado para a pergunta com ID ${questionId}.`
      )
    }

    await this.scoresRepo.deleteByQuestionId(questionId)
  }
}
