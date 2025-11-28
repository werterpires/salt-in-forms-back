export enum EQuestionOptionsTypes {
  TYPE_ONE = 1,
  TYPE_TWO = 2,
  TYPE_THREE = 3
}
export const QuestionOptionsTypesDetails: Record<
  EQuestionOptionsTypes,
  { typeName: string }
> = {
  [EQuestionOptionsTypes.TYPE_ONE]: {
    typeName: 'Type One'
  },
  [EQuestionOptionsTypes.TYPE_TWO]: {
    typeName: 'Type Two'
  },
  [EQuestionOptionsTypes.TYPE_THREE]: {
    typeName: 'Type Three'
  }
}

export const QuestionOptionsTypesArray = Object.values(
  EQuestionOptionsTypes
).filter((value) => typeof value === 'number') as EQuestionOptionsTypes[]
