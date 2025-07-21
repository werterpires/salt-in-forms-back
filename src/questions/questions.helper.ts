import { BadRequestException } from '@nestjs/common'
import { CreateQuestion, UpdateQuestion } from './types'
import { FormSectionDisplayRules } from '../constants/form-section-display-rules.const'
import { QuestionsRepo } from './questions.repo'
import { CreateQuestionDto } from './dto/create-question.dto'
import { UpdateQuestionDto } from './dto/update-question.dto'
import { AnswersDisplayRules } from 'src/constants/answer_display_rule'
import { EQuestionsTypes } from '../constants/questions-types.enum'
import { EQuestionOptionsTypes } from '../constants/questions-options-types.enum'

export class QuestionsHelper {
  static async transformCreateDto(
    createQuestionDto: CreateQuestionDto,
    questionsRepo: QuestionsRepo
  ): Promise<CreateQuestion> {
    await this.validateCreateQuestion(createQuestionDto, questionsRepo)

    const answerDisplayValue = createQuestionDto.answerDisplayValue
      ? createQuestionDto.answerDisplayValue.join('||')
      : undefined

    return {
      formSectionId: createQuestionDto.formSectionId,
      questionAreaId: createQuestionDto.questionAreaId,
      questionOrder: createQuestionDto.questionOrder,
      questionType: createQuestionDto.questionType,
      questionStatement: createQuestionDto.questionStatement,
      questionDescription: createQuestionDto.questionDescription,
      questionDisplayRule: createQuestionDto.questionDisplayRule,
      formSectionDisplayLink: createQuestionDto.formSectionDisplayLink,
      questionDisplayLink: createQuestionDto.questionDisplayLink,
      answerDisplayRule: createQuestionDto.answerDisplayRule,
      answerDisplayValue
    }
  }

  static async transformUpdateDto(
    updateQuestionDto: UpdateQuestionDto,
    questionsRepo: QuestionsRepo
  ): Promise<UpdateQuestion> {
    await this.validateUpdateQuestion(updateQuestionDto, questionsRepo)

    const answerDisplayValue = updateQuestionDto.answerDisplayValue
      ? updateQuestionDto.answerDisplayValue.join('||')
      : undefined

    return {
      questionId: updateQuestionDto.questionId,
      questionAreaId: updateQuestionDto.questionAreaId,
      questionType: updateQuestionDto.questionType,
      questionStatement: updateQuestionDto.questionStatement,
      questionDescription: updateQuestionDto.questionDescription,
      questionDisplayRule: updateQuestionDto.questionDisplayRule,
      formSectionDisplayLink: updateQuestionDto.formSectionDisplayLink,
      questionDisplayLink: updateQuestionDto.questionDisplayLink,
      answerDisplayRule: updateQuestionDto.answerDisplayRule,
      answerDisplayValue
    }
  }

  static async validateCreateQuestion(
    createQuestionDto: CreateQuestionDto,
    questionsRepo: QuestionsRepo
  ): Promise<void> {
    // Validar opções da pergunta
    this.validateQuestionOptions(createQuestionDto.questionType, createQuestionDto.questionOptions)
    // Validar se a regra de exibição é válida
    if (
      !Object.values(FormSectionDisplayRules).includes(
        createQuestionDto.questionDisplayRule
      )
    ) {
      throw new BadRequestException('#Regra de exibição inválida')
    }

    // Validar campos obrigatórios baseados na regra de exibição
    if (
      (createQuestionDto.questionDisplayRule as FormSectionDisplayRules) !==
      FormSectionDisplayRules.ALWAYS_SHOW
    ) {
      if (
        !createQuestionDto.formSectionDisplayLink ||
        !createQuestionDto.questionDisplayLink ||
        !createQuestionDto.answerDisplayRule ||
        !createQuestionDto.answerDisplayValue
      ) {
        throw new BadRequestException(
          '#Para regras de exibição diferentes de "Sempre aparecer", é obrigatório informar uma seção, uma questão, uma regra de checagem e os valores de reposta'
        )
      }
    } else {
      // Se for "Sempre aparecer", nenhum desses campos deve existir
      if (
        createQuestionDto.formSectionDisplayLink ||
        createQuestionDto.questionDisplayLink ||
        createQuestionDto.answerDisplayRule ||
        createQuestionDto.answerDisplayValue
      ) {
        throw new BadRequestException(
          '#Para regra "Sempre aparecer", não devem ser informados uma seção, uma questão, uma regra de checagem ou os valores de reposta'
        )
      }
    }

    // Validar se a seção existe
    const section = await questionsRepo.findSectionById(
      createQuestionDto.formSectionId
    )
    if (!section) {
      throw new BadRequestException('#Seção não encontrada')
    }

    // Validar se formSectionDisplayLink é válido (se fornecido)
    if (createQuestionDto.formSectionDisplayLink) {
      const linkedSection = await questionsRepo.findSectionById(
        createQuestionDto.formSectionDisplayLink
      )
      if (!linkedSection) {
        throw new BadRequestException(
          '#Seção vinculada à regra de exibição não encontrada'
        )
      }

      // Verificar se ambas as seções são do mesmo formulário
      if (section.sFormId !== linkedSection.sFormId) {
        throw new BadRequestException(
          '#A seção vinculada deve ser do mesmo formulário'
        )
      }

      // Verificar se a seção vinculada tem ordem igual ou anterior
      if (linkedSection.formSectionOrder > section.formSectionOrder) {
        throw new BadRequestException(
          '#A seção vinculada deve ter ordem igual ou anterior à seção da pergunta'
        )
      }

      // Se for a mesma seção, validar a pergunta vinculada
      if (createQuestionDto.questionDisplayLink) {
        const linkedQuestion = await questionsRepo.findById(
          createQuestionDto.questionDisplayLink
        )
        if (!linkedQuestion) {
          throw new BadRequestException('#Pergunta vinculada não encontrada')
        }

        if (linkedQuestion.questionOrder >= createQuestionDto.questionOrder) {
          throw new BadRequestException(
            '#A pergunta vinculada na regra de exibição deve ter ordem menor que a pergunta que está sendo criada'
          )
        }
      }

      // Validar se a regra de exibição da resposta é válida
      if (createQuestionDto.answerDisplayRule) {
        if (
          !Object.values(AnswersDisplayRules).includes(
            createQuestionDto.answerDisplayRule as AnswersDisplayRules
          )
        ) {
          throw new BadRequestException(
            '#Regra de exibição de resposta inválida'
          )
        }
      }
    }
  }

  static async validateUpdateQuestion(
    updateQuestionDto: UpdateQuestionDto,
    questionsRepo: QuestionsRepo
  ): Promise<void> {
    // Validar opções da pergunta
    this.validateQuestionOptions(updateQuestionDto.questionType, updateQuestionDto.questionOptions)
    // Buscar a pergunta existente
    const existingQuestion = await questionsRepo.findById(
      updateQuestionDto.questionId
    )
    if (!existingQuestion) {
      throw new BadRequestException('#Pergunta não encontrada')
    }

    // Validar se a regra de exibição é válida
    if (
      !Object.values(FormSectionDisplayRules).includes(
        updateQuestionDto.questionDisplayRule
      )
    ) {
      throw new BadRequestException('#Regra de exibição inválida')
    }

    // Validar campos obrigatórios baseados na regra de exibição
    if (
      (updateQuestionDto.questionDisplayRule as FormSectionDisplayRules) !==
      FormSectionDisplayRules.ALWAYS_SHOW
    ) {
      if (
        !updateQuestionDto.formSectionDisplayLink ||
        !updateQuestionDto.questionDisplayLink ||
        !updateQuestionDto.answerDisplayRule ||
        !updateQuestionDto.answerDisplayValue
      ) {
        throw new BadRequestException(
          '#Para regras de exibição diferentes de "Sempre aparecer", é obrigatório informar formSectionDisplayLink, questionDisplayLink, answerDisplayRule e answerDisplayValue'
        )
      }
    } else {
      // Se for "Sempre aparecer", nenhum desses campos deve existir
      if (
        updateQuestionDto.formSectionDisplayLink ||
        updateQuestionDto.questionDisplayLink ||
        updateQuestionDto.answerDisplayRule ||
        updateQuestionDto.answerDisplayValue
      ) {
        throw new BadRequestException(
          '#Para regra "Sempre aparecer", não devem ser informados formSectionDisplayLink, questionDisplayLink, answerDisplayRule nem answerDisplayValue'
        )
      }
    }

    // Buscar a seção da pergunta
    const section = await questionsRepo.findSectionById(
      existingQuestion.formSectionId
    )
    if (!section) {
      throw new BadRequestException('#Seção não encontrada')
    }

    // Validar se formSectionDisplayLink é válido (se fornecido)
    if (updateQuestionDto.formSectionDisplayLink) {
      const linkedSection = await questionsRepo.findSectionById(
        updateQuestionDto.formSectionDisplayLink
      )
      if (!linkedSection) {
        throw new BadRequestException('#Seção vinculada não encontrada')
      }

      // Verificar se ambas as seções são do mesmo formulário
      if (section.sFormId !== linkedSection.sFormId) {
        throw new BadRequestException(
          '#A seção vinculada deve ser do mesmo formulário'
        )
      }

      // Verificar se a seção vinculada tem ordem igual ou anterior
      if (linkedSection.formSectionOrder > section.formSectionOrder) {
        throw new BadRequestException(
          '#A seção vinculada deve ter ordem igual ou anterior à seção da pergunta'
        )
      }

      // Se for a mesma seção, validar a pergunta vinculada
      if (updateQuestionDto.questionDisplayLink) {
        const linkedQuestion = await questionsRepo.findById(
          updateQuestionDto.questionDisplayLink
        )
        if (!linkedQuestion) {
          throw new BadRequestException('#Pergunta vinculada não encontrada')
        }

        if (linkedQuestion.questionOrder >= existingQuestion.questionOrder) {
          throw new BadRequestException(
            '#A pergunta vinculada na regra de exibição deve ter ordem menor que a pergunta sendo editada'
          )
        }
      }

      // Validar se a regra de exibição da resposta é válida
      if (updateQuestionDto.answerDisplayRule) {
        if (
          !Object.values(AnswersDisplayRules).includes(
            updateQuestionDto.answerDisplayRule as AnswersDisplayRules
          )
        ) {
          throw new BadRequestException(
            '#Regra de exibição de resposta inválida'
          )
        }
      }
    }
  }

  static async validateReorderData(
    questions: { questionId: number; questionOrder: number }[],
    questionsRepo: QuestionsRepo
  ): Promise<void> {
    if (!questions || questions.length === 0) {
      throw new BadRequestException('#Array de perguntas não pode estar vazio')
    }

    // Buscar todas as perguntas do array para validação
    const questionIds = questions.map((q) => q.questionId)
    const allQuestions = await questionsRepo.findByIds(questionIds)

    if (allQuestions.length !== questions.length) {
      throw new BadRequestException(
        '#Uma ou mais perguntas não foram encontradas'
      )
    }

    // Verificar se todas as perguntas são da mesma seção
    const firstSectionId = allQuestions[0].formSectionId
    const allSameSection = allQuestions.every(
      (q) => q.formSectionId === firstSectionId
    )

    if (!allSameSection) {
      throw new BadRequestException(
        '#Todas as perguntas devem ser da mesma seção'
      )
    }

    // Buscar todas as perguntas da seção
    const allSectionQuestions =
      await questionsRepo.findAllBySectionId(firstSectionId)

    if (allSectionQuestions.length !== questions.length) {
      throw new BadRequestException(
        '#Todas as perguntas da seção devem estar presentes no array'
      )
    }

    // Validar se todos os IDs da seção estão no array
    const questionIds2 = questions
      .map((q) => q.questionId)
      .sort((a, b) => a - b)
    const sectionQuestionIds = allSectionQuestions
      .map((q) => q.questionId)
      .sort((a, b) => a - b)

    if (JSON.stringify(questionIds2) !== JSON.stringify(sectionQuestionIds)) {
      throw new BadRequestException(
        '#Todas as perguntas da seção devem estar presentes no array'
      )
    }

    // Validar ordenação sequencial sem saltos nem repetições
    const orders = questions.map((q) => q.questionOrder).sort((a, b) => a - b)

    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        throw new BadRequestException(
          '#A ordenação deve ser sequencial, começando em 1 e sem saltos'
        )
      }
    }
  }

  static validateQuestionOptions(
    questionType: number,
    questionOptions?: { questionOptionType: number; questionOptionValue: string }[]
  ): void {
    // a) se a pergunta for do tipo "Resposta Aberta", "Data" ou "Hora", as questionOptions devem não existir
    if (
      questionType === EQuestionsTypes.OPEN_ANSWER ||
      questionType === EQuestionsTypes.DATE ||
      questionType === EQuestionsTypes.TIME
    ) {
      if (questionOptions && questionOptions.length > 0) {
        throw new BadRequestException(
          '#Perguntas do tipo Resposta Aberta, Data ou Hora não devem ter opções'
        )
      }
      return
    }

    // b) se for "Escolha Múltipla", "Escolha única", deve ter pelo menos 2 options do questionOptionsType 1 e 0 dos outros tipos
    if (
      questionType === EQuestionsTypes.MULTIPLE_CHOICE ||
      questionType === EQuestionsTypes.SINGLE_CHOICE ||
      questionType === EQuestionsTypes.LIKERT_SCALE ||
      questionType === EQuestionsTypes.MULTIPLE_RESPONSES
    ) {
      if (!questionOptions || questionOptions.length < 2) {
        throw new BadRequestException(
          '#Este tipo de pergunta deve ter pelo menos 2 opções'
        )
      }

      const type1Options = questionOptions.filter(
        (opt) => opt.questionOptionType === EQuestionOptionsTypes.TYPE_ONE
      )
      const type2Options = questionOptions.filter(
        (opt) => opt.questionOptionType === EQuestionOptionsTypes.TYPE_TWO
      )
      const type3Options = questionOptions.filter(
        (opt) => opt.questionOptionType === EQuestionOptionsTypes.TYPE_THREE
      )

      if (type1Options.length < 2) {
        throw new BadRequestException(
          '#Este tipo de pergunta deve ter pelo menos 2 opções do tipo 1'
        )
      }

      if (type2Options.length > 0 || type3Options.length > 0) {
        throw new BadRequestException(
          '#Este tipo de pergunta deve ter apenas opções do tipo 1'
        )
      }
    }

    // c) se for "Matriz de escolha única" ou "matriz de escolha múltipla", deve ter pelo menos 2 options do questionOptionsType 1, ao menos 2 options do questionOptionsType 2, e 0 do questionOptionsType 3
    if (
      questionType === EQuestionsTypes.SINGLE_CHOICE_MATRIX ||
      questionType === EQuestionsTypes.MULTIPLE_CHOICE_MATRIX
    ) {
      if (!questionOptions || questionOptions.length < 4) {
        throw new BadRequestException(
          '#Este tipo de pergunta deve ter pelo menos 4 opções (2 do tipo 1 e 2 do tipo 2)'
        )
      }

      const type1Options = questionOptions.filter(
        (opt) => opt.questionOptionType === EQuestionOptionsTypes.TYPE_ONE
      )
      const type2Options = questionOptions.filter(
        (opt) => opt.questionOptionType === EQuestionOptionsTypes.TYPE_TWO
      )
      const type3Options = questionOptions.filter(
        (opt) => opt.questionOptionType === EQuestionOptionsTypes.TYPE_THREE
      )

      if (type1Options.length < 2) {
        throw new BadRequestException(
          '#Este tipo de pergunta deve ter pelo menos 2 opções do tipo 1'
        )
      }

      if (type2Options.length < 2) {
        throw new BadRequestException(
          '#Este tipo de pergunta deve ter pelo menos 2 opções do tipo 2'
        )
      }

      if (type3Options.length > 0) {
        throw new BadRequestException(
          '#Este tipo de pergunta não deve ter opções do tipo 3'
        )
      }
    }

    // d) duas options, da mesma question, do mesmo optionType, não podem ter o mesmo valor
    if (questionOptions) {
      const groupedByType = questionOptions.reduce((acc, option) => {
        if (!acc[option.questionOptionType]) {
          acc[option.questionOptionType] = []
        }
        acc[option.questionOptionType].push(option.questionOptionValue)
        return acc
      }, {} as Record<number, string[]>)

      for (const [type, values] of Object.entries(groupedByType)) {
        const uniqueValues = new Set(values)
        if (uniqueValues.size !== values.length) {
          throw new BadRequestException(
            `#Não podem existir valores duplicados nas opções do tipo ${type}`
          )
        }
      }
    }
  }
}
