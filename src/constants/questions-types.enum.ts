export enum EQuestionsTypes {
  OPEN_ANSWER = 1,
  MULTIPLE_CHOICE = 2,
  SINGLE_CHOICE = 3,
  LIKERT_SCALE = 4,
  SINGLE_CHOICE_MATRIX = 5,
  MULTIPLE_CHOICE_MATRIX = 6,
  DATE = 7,
  TIME = 8,
  MULTIPLE_RESPONSES = 9,
  EMAIL = 10,
  FIELDS = 11
}

export const QuestionsTypesDetails: Record<
  EQuestionsTypes,
  { typeName: string }
> = {
  [EQuestionsTypes.OPEN_ANSWER]: {
    typeName: 'Resposta Aberta'
  },
  [EQuestionsTypes.MULTIPLE_CHOICE]: {
    typeName: 'Escolha Múltipla'
  },
  [EQuestionsTypes.SINGLE_CHOICE]: {
    typeName: 'Escolha Única'
  },
  [EQuestionsTypes.LIKERT_SCALE]: {
    typeName: 'Escala Likert'
  },
  [EQuestionsTypes.SINGLE_CHOICE_MATRIX]: {
    typeName: 'Matriz de Escolha Única'
  },
  [EQuestionsTypes.MULTIPLE_CHOICE_MATRIX]: {
    typeName: 'Matriz de Escolha Múltipla'
  },
  [EQuestionsTypes.DATE]: {
    typeName: 'Data'
  },
  [EQuestionsTypes.TIME]: {
    typeName: 'Hora'
  },
  [EQuestionsTypes.MULTIPLE_RESPONSES]: {
    typeName: 'Respostas Múltiplas'
  },
  [EQuestionsTypes.EMAIL]: {
    typeName: 'Email'
  },
  [EQuestionsTypes.FIELDS]: {
    typeName: 'Campos'
  }
}
export const QuestionsTypesArray = Object.values(EQuestionsTypes).filter(
  (value) => typeof value === 'number'
) as EQuestionsTypes[]
