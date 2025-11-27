import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  Min
} from 'class-validator'
import {
  EScoreType,
  EDateComparisonType
} from '../../constants/score-types.enum'

export class OptionScoresJsonDto {
  [optionId: string]: number
}

export class QuestionScoreDto {
  @IsEnum(EScoreType, {
    message: '#O tipo de pontuação deve ser OPTION_BASED ou DATE_BASED.'
  })
  scoreType: EScoreType

  // Para OPTION_BASED: JSON com { optionId: scoreValue }
  @ValidateIf((o) => o.scoreType === EScoreType.OPTION_BASED)
  @IsObject({
    message:
      '#Para pontuação baseada em opções, optionScoresJson deve ser um objeto.'
  })
  optionScoresJson?: Record<string, number>

  // Para DATE_BASED: tipo de comparação de data
  @ValidateIf((o) => o.scoreType === EScoreType.DATE_BASED)
  @IsEnum(EDateComparisonType, {
    message: '#O tipo de comparação deve ser BEFORE ou ON_OR_AFTER.'
  })
  dateComparisonType?: EDateComparisonType

  // Para DATE_BASED: data de corte
  @ValidateIf((o) => o.scoreType === EScoreType.DATE_BASED)
  @IsString({
    message: '#A data de corte deve ser uma string no formato YYYY-MM-DD.'
  })
  cutoffDate?: string

  // Para DATE_BASED: pontuação da data
  @ValidateIf((o) => o.scoreType === EScoreType.DATE_BASED)
  @IsNumber(
    {},
    {
      message: '#A pontuação da data deve ser numérica.'
    }
  )
  @Min(0, {
    message: '#A pontuação da data deve ser maior ou igual a 0.'
  })
  dateScore?: number

  @IsOptional()
  @IsNumber(
    {},
    {
      message: '#O ID da pontuação da pergunta deve ser numérico.'
    }
  )
  questionScoreId?: number

  @IsOptional()
  @IsNumber(
    {},
    {
      message: '#O ID da pergunta deve ser numérico.'
    }
  )
  questionId?: number
}
