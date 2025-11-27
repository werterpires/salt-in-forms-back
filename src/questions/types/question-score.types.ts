import { EScoreType, EDateComparisonType } from '../../constants/score-types.enum'

export interface IOptionScoresJson {
  [optionId: string]: number
}

export interface IQuestionScore {
  questionScoreId: number
  questionId: number
  scoreType: EScoreType
  optionScoresJson: IOptionScoresJson | null
  dateComparisonType: EDateComparisonType | null
  cutoffDate: string | null
  dateScore: number | null
  created_at?: Date
  updated_at?: Date
}

export interface ICreateQuestionScore {
  questionId: number
  scoreType: EScoreType
  optionScoresJson?: IOptionScoresJson | null
  dateComparisonType?: EDateComparisonType | null
  cutoffDate?: string | null
  dateScore?: number | null
}

export interface IUpdateQuestionScore {
  questionScoreId: number
  questionId: number
  scoreType: EScoreType
  optionScoresJson?: IOptionScoresJson | null
  dateComparisonType?: EDateComparisonType | null
  cutoffDate?: string | null
  dateScore?: number | null
}
