import { Injectable } from '@nestjs/common'
import { FieldsRepo } from './fields.repo'
import { FindAllResponse, Paginator } from '../shared/types/types'
import { buildUnionsWithFields } from './fields.helper'
import { Union } from 'src/ministerials/type'
import * as db from 'src/constants/db-schema.enum'
import { FieldWithMinisterial, FieldsWithMinisterialsFilter } from './type'

@Injectable()
export class FieldsService {
  constructor(private readonly fieldsRepo: FieldsRepo) {}

  async findAllUnions(): Promise<FindAllResponse<Union>> {
    const unions = await this.fieldsRepo.findAllUnions()

    const fieldsMap = new Map()

    // Buscar fields para cada union
    for (const union of unions) {
      const fields = await this.fieldsRepo.findFieldsByUnionId(union.unionId)
      fieldsMap.set(union.unionId, fields)
    }

    const unionsWithFields = buildUnionsWithFields(unions, fieldsMap)

    const response: FindAllResponse<Union> = {
      data: unionsWithFields,
      pagesQuantity: 1 // Como limitamos a 1000, assumimos 1 página
    }

    return response
  }

  async findAllFieldsWithMinisterials(
    paginator: Paginator<typeof db.Fields>,
    filters: FieldsWithMinisterialsFilter
  ): Promise<FindAllResponse<FieldWithMinisterial>> {
    const fields = await this.fieldsRepo.findAllFieldsWithUnions(
      paginator,
      filters
    )
    const pagesQuantity = await this.fieldsRepo.findFieldsCount(filters)

    if (fields.length === 0) {
      return { data: [], pagesQuantity }
    }

    const fieldIds = fields.map((f) => f.fieldId)
    const ministerials =
      await this.fieldsRepo.findMinisterialsByFieldIds(fieldIds)

    const ministerialsByField = new Map<number, typeof ministerials>()
    for (const m of ministerials) {
      const list = ministerialsByField.get(m.fieldId!) ?? []
      list.push(m)
      ministerialsByField.set(m.fieldId!, list)
    }

    const data: FieldWithMinisterial[] = fields.map((field) => {
      const candidates = ministerialsByField.get(field.fieldId) ?? []

      const active = candidates.find((m) => m.ministerialActive)
      const best =
        active ??
        (candidates.length > 0
          ? candidates.reduce((prev, curr) =>
              curr.ministerialId > prev.ministerialId ? curr : prev
            )
          : null)

      return {
        ...field,
        ministerialId: best?.ministerialId ?? null,
        ministerialName: best?.ministerialName ?? null,
        ministerialPrimaryPhone: best?.ministerialPrimaryPhone ?? null,
        ministerialSecondaryPhone: best?.ministerialSecondaryPhone ?? null,
        ministerialLandlinePhone: best?.ministerialLandlinePhone ?? null,
        ministerialPrimaryEmail: best?.ministerialPrimaryEmail ?? null,
        ministerialAlternativeEmail: best?.ministerialAlternativeEmail ?? null,
        ministerialSecretaryName: best?.ministerialSecretaryName ?? null,
        ministerialSecretaryPhone: best?.ministerialSecretaryPhone ?? null,
        ministerialActive: best?.ministerialActive ?? null
      }
    })

    return { data, pagesQuantity }
  }
}
