import { Union, Field } from '../ministerials/type'

export function buildUnionsWithFields(
  unions: Union[],
  fieldsMap: Map<number, Field[]>
): Union[] {
  return unions.map((union) => ({
    ...union,
    fields: fieldsMap.get(union.unionId) || []
  }))
}
