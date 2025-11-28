export enum FormSectionDisplayRules {
  ALWAYS_SHOW = 1,
  SHOW_IF = 2,
  DONT_SHOW_IF = 3
}

export const FormSectionDisplayRulesDescriptions = {
  [FormSectionDisplayRules.ALWAYS_SHOW]: 'Sempre aparecer',
  [FormSectionDisplayRules.SHOW_IF]: 'Só aparecer se',
  [FormSectionDisplayRules.DONT_SHOW_IF]: 'Não aparecer se'
}
