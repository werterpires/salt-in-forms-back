import { CreateFormSection, FormSection, UpdateFormSection } from './types'
import { CreateFormSectionDto } from './dto/create-form-section.dto'
import { UpdateFormSectionDto } from './dto/update-form-section.dto'
import { FormSectionDisplayRules } from '../constants/form-section-display-rules.const'
import { AnswersDisplayRules } from '../constants/answer_display_rule'
import { BadRequestException } from '@nestjs/common'
import { FormSectionsRepo } from './form-sections.repo'
import { EQuestionsTypes } from 'src/constants/questions-types.enum'

export class FormSectionsHelper {
  static mapCreateDtoToEntity(dto: CreateFormSectionDto): CreateFormSection {
    return {
      sFormId: dto.sFormId,
      formSectionName: dto.formSectionName,
      formSectionOrder: dto.formSectionOrder,
      formSectionDisplayRule: dto.formSectionDisplayRule,
      formSectionDisplayLink: dto.formSectionDisplayLink,
      questionDisplayLink: dto.questionDisplayLink,
      answerDisplayRule: dto.answerDisplayRule,
      answerDisplayValue: dto.answerDisplayValue
        ? dto.answerDisplayValue.join('||')
        : undefined
    }
  }

  static mapUpdateDtoToEntity(dto: UpdateFormSectionDto): UpdateFormSection {
    return {
      formSectionId: dto.formSectionId,
      formSectionName: dto.formSectionName,
      formSectionDisplayRule: dto.formSectionDisplayRule,
      formSectionDisplayLink: dto.formSectionDisplayLink,
      questionDisplayLink: dto.questionDisplayLink,
      answerDisplayRule: dto.answerDisplayRule,
      answerDisplayValue: dto.answerDisplayValue
        ? dto.answerDisplayValue.join('||')
        : undefined
    }
  }

  static sortFormSectionsByOrder(formSections: FormSection[]): FormSection[] {
    for (const section of formSections) {
      if (
        section.answerDisplayValue &&
        typeof section.answerDisplayValue === 'string'
      ) {
        section.answerDisplayValue = section.answerDisplayValue.split('||')
      }
    }

    return formSections.sort((a, b) => a.formSectionOrder - b.formSectionOrder)
  }

  static async processUpdateFormSection(
    updateFormSectionDto: UpdateFormSectionDto,
    formSectionsRepo: FormSectionsRepo
  ): Promise<UpdateFormSection> {
    // 1. Buscar a seção existente para validações
    const existingSection = await formSectionsRepo.findById(
      updateFormSectionDto.formSectionId
    )
    if (!existingSection) {
      throw new BadRequestException('#Seção não encontrada')
    }

    // 2. Validar regras de exibição completas
    this.validateCompleteDisplayRules(
      updateFormSectionDto.formSectionDisplayRule,
      updateFormSectionDto.formSectionDisplayLink,
      updateFormSectionDto.questionDisplayLink,
      updateFormSectionDto.answerDisplayRule,
      updateFormSectionDto.answerDisplayValue
    )

    // 3. Se há um displayLink, validar se a seção referenciada existe
    if (updateFormSectionDto.formSectionDisplayLink) {
      const linkedSection = await formSectionsRepo.findByIdAndSFormId(
        updateFormSectionDto.formSectionDisplayLink,
        existingSection.sFormId
      )

      if (!linkedSection) {
        throw new BadRequestException(
          '#Seção referenciada no link de exibição não encontrada'
        )
      }

      this.validateDisplayLinkOrder(
        linkedSection,
        existingSection.formSectionOrder
      )

      // 4. Validar se a questão pertence à seção referenciada
      if (updateFormSectionDto.questionDisplayLink) {
        const linkedQuestion = await formSectionsRepo.findQuestionById(
          updateFormSectionDto.questionDisplayLink
        )

        if (!linkedQuestion) {
          throw new BadRequestException('#Questão referenciada não encontrada')
        }

        const linkedQuestionType =
          linkedQuestion.questionType as EQuestionsTypes
        const allwedTypes = [
          EQuestionsTypes.MULTIPLE_CHOICE,
          EQuestionsTypes.SINGLE_CHOICE,
          EQuestionsTypes.MULTIPLE_CHOICE_MATRIX,
          EQuestionsTypes.SINGLE_CHOICE_MATRIX
        ]
        if (!allwedTypes.includes(linkedQuestionType)) {
          throw new BadRequestException(
            '#A questão referenciada deve ser uma questão de alternativas.'
          )
        }

        if (
          linkedQuestion.formSectionId !==
          updateFormSectionDto.formSectionDisplayLink
        ) {
          throw new BadRequestException(
            '#A questão deve pertencer à seção referenciada no link de exibição'
          )
        }
      }
    }

    return this.mapUpdateDtoToEntity(updateFormSectionDto)
  }

  static validateDisplayRule(displayRule: number): boolean {
    return Object.values(FormSectionDisplayRules).includes(
      displayRule as FormSectionDisplayRules
    )
  }

  static validateAnswerDisplayRule(answerDisplayRule: number): boolean {
    return Object.values(AnswersDisplayRules).includes(
      answerDisplayRule as AnswersDisplayRules
    )
  }

  static validateAnswerDisplayValue(
    answerDisplayRule: number,
    answerDisplayValue: string[]
  ): void {
    // Regras 1, 2, 3, 4, 5 só podem ter um valor
    if (
      [1, 2, 3, 4, 5].includes(answerDisplayRule) &&
      answerDisplayValue.length !== 1
    ) {
      throw new BadRequestException(
        '#Para esta regra de exibição, apenas um valor é permitido'
      )
    }

    // Regras 2, 3, 4, 5 devem ter valores numéricos ou tranformaveis em datas ou em horarios
    if ([2, 3, 4, 5].includes(answerDisplayRule)) {
      const value = answerDisplayValue[0]
      if (isNaN(Number(value)) || isNaN(Date.parse(value))) {
        throw new BadRequestException(
          '#Para esta regra de exibição, o valor deve ser numérico'
        )
      }
    }
  }

  static validateCompleteDisplayRules(
    formSectionDisplayRule: number,
    formSectionDisplayLink?: number,
    questionDisplayLink?: number,
    answerDisplayRule?: number,
    answerDisplayValue?: string[]
  ): void {
    if (
      (formSectionDisplayRule as FormSectionDisplayRules) ===
      FormSectionDisplayRules.ALWAYS_SHOW
    ) {
      // Se "sempre aparecer", as outras propriedades são proibidas
      if (
        formSectionDisplayLink ||
        questionDisplayLink ||
        answerDisplayRule ||
        answerDisplayValue
      ) {
        throw new BadRequestException(
          '#Quando a regra é "Sempre aparecer", não deve haver link de seção, link de questão, regra de resposta ou valor de resposta'
        )
      }
    } else {
      // Se não é "sempre aparecer", todas as propriedades são obrigatórias
      if (
        !formSectionDisplayLink ||
        !questionDisplayLink ||
        !answerDisplayRule ||
        !answerDisplayValue ||
        answerDisplayValue.length === 0
      ) {
        throw new BadRequestException(
          '#Quando a regra não é "Sempre aparecer", link de seção, link de questão, regra de resposta e valor de resposta são obrigatórios'
        )
      }

      // Validar se a regra de resposta é válida
      if (!this.validateAnswerDisplayRule(answerDisplayRule)) {
        throw new BadRequestException('#Regra de exibição de resposta inválida')
      }

      // Validar os valores de resposta
      this.validateAnswerDisplayValue(answerDisplayRule, answerDisplayValue)
    }
  }

  static validateDisplayRuleAndLink(
    displayRule: number,
    displayLink?: number
  ): void {
    if (!this.validateDisplayRule(displayRule)) {
      throw new BadRequestException('#Regra de exibição inválida')
    }

    if (
      (displayRule as FormSectionDisplayRules) !==
        FormSectionDisplayRules.ALWAYS_SHOW &&
      !displayLink
    ) {
      throw new BadRequestException(
        '#Link de exibição é obrigatório quando a regra não é "Sempre aparecer"'
      )
    }
  }

  static processDisplayLink(
    displayRule: number,
    displayLink?: number
  ): number | undefined {
    return (displayRule as FormSectionDisplayRules) ===
      FormSectionDisplayRules.ALWAYS_SHOW
      ? undefined
      : displayLink
  }

  static validateDisplayLinkOrder(
    linkSection: FormSection,
    newSectionOrder: number
  ): void {
    if (linkSection.formSectionOrder >= newSectionOrder) {
      throw new BadRequestException(
        '#A seção referenciada no link de exibição deve ter ordem menor que a seção sendo criada'
      )
    }
  }

  static async processCreateFormSection(
    createFormSectionDto: CreateFormSectionDto,
    formSectionsRepo: FormSectionsRepo
  ): Promise<CreateFormSection> {
    // 1. Validar regras de exibição completas
    this.validateCompleteDisplayRules(
      createFormSectionDto.formSectionDisplayRule,
      createFormSectionDto.formSectionDisplayLink,
      createFormSectionDto.questionDisplayLink,
      createFormSectionDto.answerDisplayRule,
      createFormSectionDto.answerDisplayValue
    )

    // 2. Se há um displayLink, validar se a seção referenciada existe e tem ordem menor
    if (createFormSectionDto.formSectionDisplayLink) {
      const linkedSection = await formSectionsRepo.findByIdAndSFormId(
        createFormSectionDto.formSectionDisplayLink,
        createFormSectionDto.sFormId
      )

      if (!linkedSection) {
        throw new BadRequestException(
          '#Seção referenciada no link de exibição não encontrada'
        )
      }

      this.validateDisplayLinkOrder(
        linkedSection,
        createFormSectionDto.formSectionOrder
      )

      // 3. Validar se a questão pertence à seção referenciada
      if (createFormSectionDto.questionDisplayLink) {
        const linkedQuestion = await formSectionsRepo.findQuestionById(
          createFormSectionDto.questionDisplayLink
        )

        if (!linkedQuestion) {
          throw new BadRequestException('#Questão referenciada não encontrada')
        }

        if (
          linkedQuestion.formSectionId !==
          createFormSectionDto.formSectionDisplayLink
        ) {
          throw new BadRequestException(
            '#A questão deve pertencer à seção referenciada no link de exibição'
          )
        }
      }
    }

    // 4. Processar o displayLink conforme a regra
    const processedDisplayLink = this.processDisplayLink(
      createFormSectionDto.formSectionDisplayRule,
      createFormSectionDto.formSectionDisplayLink
    )

    return {
      ...this.mapCreateDtoToEntity(createFormSectionDto),
      formSectionDisplayLink: processedDisplayLink
    }
  }

  static async validateSectionDeletion(
    formSectionId: number,
    formSectionsRepo: FormSectionsRepo
  ): Promise<void> {
    // 1. Verificar se o ID da seção está sendo usado em alguma regra de display de questão
    const questionsUsingSection =
      await formSectionsRepo.findQuestionsUsingFormSectionDisplayLink(
        formSectionId
      )

    if (questionsUsingSection.length > 0) {
      const question = questionsUsingSection[0]
      throw new BadRequestException(
        `#A seção não pode ser excluída porque está vinculada à questão "${question.questionStatement}" (ordem ${question.questionOrder}). Desfaça a vinculação antes de excluir a seção.`
      )
    }

    // 2. Verificar se o ID da seção está sendo usado em alguma regra de display de seção
    const sectionsUsingSection =
      await formSectionsRepo.findSectionsUsingFormSectionDisplayLink(
        formSectionId
      )

    if (sectionsUsingSection.length > 0) {
      const section = sectionsUsingSection[0]
      throw new BadRequestException(
        `#A seção não pode ser excluída porque está vinculada à seção "${section.formSectionName}" (ordem ${section.formSectionOrder}). Desfaça a vinculação antes de excluir a seção.`
      )
    }
  }

  static async validateReorderData(
    sections: { formSectionId: number; formSectionOrder: number }[],
    formSectionsRepo: FormSectionsRepo
  ): Promise<void> {
    if (sections.length === 0) {
      throw new BadRequestException('#Array de seções não pode estar vazio')
    }

    // Buscar todas as seções para validação
    const firstSectionId = sections[0].formSectionId
    const firstSection = await formSectionsRepo.findById(firstSectionId)

    if (!firstSection) {
      throw new BadRequestException('#Seção não encontrada')
    }

    const sFormId = firstSection.sFormId
    const allFormSections = await formSectionsRepo.findAllBySFormId(sFormId)

    // Validar se todas as seções são do mesmo formulário
    for (const section of sections) {
      const foundSection = allFormSections.find(
        (s) => s.formSectionId === section.formSectionId
      )
      if (!foundSection) {
        throw new BadRequestException(
          '#Todas as seções devem pertencer ao mesmo formulário'
        )
      }
    }

    // Validar se todas as seções do formulário estão no array
    if (sections.length !== allFormSections.length) {
      throw new BadRequestException(
        '#Todas as seções do formulário devem estar presentes no array'
      )
    }

    // Validar se todos os IDs do formulário estão no array
    const sectionIds = sections
      .map((s) => s.formSectionId)
      .sort((a, b) => a - b)
    const formSectionIds = allFormSections
      .map((s) => s.formSectionId)
      .sort((a, b) => a - b)

    if (JSON.stringify(sectionIds) !== JSON.stringify(formSectionIds)) {
      throw new BadRequestException(
        '#Todas as seções do formulário devem estar presentes no array'
      )
    }

    // Validar ordenação sequencial sem saltos nem repetições
    const orders = sections.map((s) => s.formSectionOrder).sort((a, b) => a - b)

    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        throw new BadRequestException(
          '#A ordenação deve ser sequencial, começando em 1, sem saltos ou repetições'
        )
      }
    }

    sections.forEach((incomingSection) => {
      const currentSection = allFormSections.find(
        (s) => s.formSectionId === incomingSection.formSectionId
      )
      if (!currentSection) {
        throw new BadRequestException('#Seção não encontrada')
      }

      if (currentSection.formSectionDisplayRule !== 1) {
        const sectionLinkId = currentSection.formSectionDisplayLink

        const sectionLink = allFormSections.find(
          (s) => s.formSectionId === sectionLinkId
        )
        if (!sectionLink) {
          throw new BadRequestException('#Seção referenciada não encontrada')
        }

        if (sectionLink.formSectionOrder >= incomingSection.formSectionOrder) {
          throw new BadRequestException(
            `#A seção ${currentSection.formSectionName} depende da seção ${sectionLink.formSectionName}. Por isso a seção ${sectionLink.formSectionName} deve estar antes da seção ${currentSection.formSectionName}`
          )
        }
      }
    })
  }
}
