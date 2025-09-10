export enum AnswersDisplayRules {
  EQUALS = 1,
  MORE_THAN = 2,
  LESS_THAN = 3,
  MORE_THAN_OR_EQUAL = 4,
  LESS_THAN_OR_EQUAL = 5,
  INCLUDES = 6,
  EXCLUDES = 7
}

export const AnswersDisplayRulesDescriptions = {
  [AnswersDisplayRules.EQUALS]: 'Igual a',
  [AnswersDisplayRules.MORE_THAN]: 'Maior que',
  [AnswersDisplayRules.LESS_THAN]: 'Menor que',
  [AnswersDisplayRules.MORE_THAN_OR_EQUAL]: 'Maior ou igual a',
  [AnswersDisplayRules.LESS_THAN_OR_EQUAL]: 'Menor ou igual a',
  [AnswersDisplayRules.INCLUDES]: 'Inclui algum',
  [AnswersDisplayRules.EXCLUDES]: 'Não inclui nenhum'
}

export const AnswersDisplayRulesOptions = Object.entries(
  AnswersDisplayRulesDescriptions
).map(([value, label]) => ({
  value: parseInt(value, 10),
  label
}))
