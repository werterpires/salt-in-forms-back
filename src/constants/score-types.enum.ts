export enum EScoreType {
  OPTION_BASED = 'OPTION_BASED',
  DATE_BASED = 'DATE_BASED'
}

export enum EDateComparisonType {
  BEFORE = 'BEFORE',
  ON_OR_AFTER = 'ON_OR_AFTER'
}

export const ScoreTypeDetails: Record<EScoreType, { typeName: string }> = {
  [EScoreType.OPTION_BASED]: {
    typeName: 'Baseado em Opções'
  },
  [EScoreType.DATE_BASED]: {
    typeName: 'Baseado em Data'
  }
}

export const DateComparisonTypeDetails: Record<
  EDateComparisonType,
  { typeName: string }
> = {
  [EDateComparisonType.BEFORE]: {
    typeName: 'Antes da Data'
  },
  [EDateComparisonType.ON_OR_AFTER]: {
    typeName: 'Na Data ou Após'
  }
}
