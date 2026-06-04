import { EScoreType, EDateComparisonType } from '../constants/score-types.enum'

export interface IUpsertScore {
  questionId: number
  scoreType: EScoreType
  optionScoresJson?: Record<string, number> | null
  dateComparisonType?: EDateComparisonType | null
  cutoffDate?: string | null
  dateScore?: number | null
}
