import {
  IsEnum,
  IsNumber,
  IsObject,
  IsString,
  ValidateIf,
  Min
} from 'class-validator'
import {
  EScoreType,
  EDateComparisonType
} from '../../constants/score-types.enum'

export class CreateScoreDto {
  @IsNumber({}, { message: '#O ID da pergunta deve ser numérico.' })
  questionId: number

  @IsEnum(EScoreType, {
    message: '#O tipo de pontuação deve ser OPTION_BASED ou DATE_BASED.'
  })
  scoreType: EScoreType

  // Obrigatório para OPTION_BASED — mapa de valor da opção para pontuação
  @ValidateIf((o) => o.scoreType === EScoreType.OPTION_BASED)
  @IsObject({
    message:
      '#Para pontuação baseada em opções, optionScoresJson deve ser um objeto.'
  })
  optionScoresJson?: Record<string, number>

  // Obrigatório para DATE_BASED
  @ValidateIf((o) => o.scoreType === EScoreType.DATE_BASED)
  @IsEnum(EDateComparisonType, {
    message: '#O tipo de comparação deve ser BEFORE ou ON_OR_AFTER.'
  })
  dateComparisonType?: EDateComparisonType

  @ValidateIf((o) => o.scoreType === EScoreType.DATE_BASED)
  @IsString({
    message: '#A data de corte deve ser uma string no formato YYYY-MM-DD.'
  })
  cutoffDate?: string

  @ValidateIf((o) => o.scoreType === EScoreType.DATE_BASED)
  @IsNumber({}, { message: '#A pontuação da data deve ser numérica.' })
  @Min(0, { message: '#A pontuação da data deve ser maior ou igual a 0.' })
  dateScore?: number
}
