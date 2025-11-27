import {
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common'
import {
  CreateQuestion,
  UpdateQuestion,
  Validation,
  QuestionOption,
  Question
} from './types'
import { FormSectionDisplayRules } from '../constants/form-section-display-rules.const'
import { QuestionsRepo } from './questions.repo'
import { CreateQuestionDto } from './dto/create-question.dto'
import { UpdateQuestionDto } from './dto/update-question.dto'
import { AnswersDisplayRules } from 'src/constants/answer_display_rule'
import { EQuestionsTypes } from '../constants/questions-types.enum'
import { EQuestionOptionsTypes } from '../constants/questions-options-types.enum'
import { QuestionOptionDto } from './dto/optionsDto'
import { QuestionScoreDto } from './dto/question-score.dto'
import { EScoreType } from '../constants/score-types.enum'

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
      answerDisplayValue,
      validations: createQuestionDto.validations,
      questionOptions: createQuestionDto.questionOptions,
      subQuestions: createQuestionDto.subQuestions,
      questionScore: createQuestionDto.questionScore
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

    const updateQuestionData: UpdateQuestion = {
      questionId: updateQuestionDto.questionId,
      questionAreaId: updateQuestionDto.questionAreaId,
      questionType: updateQuestionDto.questionType,
      questionStatement: updateQuestionDto.questionStatement,
      questionDescription: updateQuestionDto.questionDescription,
      questionDisplayRule: updateQuestionDto.questionDisplayRule,
      formSectionDisplayLink: updateQuestionDto.formSectionDisplayLink,
      questionDisplayLink: updateQuestionDto.questionDisplayLink,
      answerDisplayRule: updateQuestionDto.answerDisplayRule,
      answerDisplayValue,
      validations: updateQuestionDto.validations,
      questionOptions: updateQuestionDto.questionOptions,
      subQuestions: updateQuestionDto.subQuestions
    }

    // Prepare question options if they exist
    let questionOptions: QuestionOption[] | undefined
    if (
      updateQuestionDto.questionOptions &&
      updateQuestionDto.questionOptions.length > 0
    ) {
      questionOptions = updateQuestionDto.questionOptions.map((option) => ({
        questionId: updateQuestionDto.questionId,
        questionOptionId: option.questionOptionId,
        questionOptionType: option.questionOptionType,
        questionOptionValue: option.questionOptionValue
      }))
    }

    updateQuestionData.questionOptions = questionOptions
    updateQuestionData.questionScore = updateQuestionDto.questionScore

    return updateQuestionData
  }

  static async validateCreateQuestion(
    createQuestionDto: CreateQuestionDto,
    questionsRepo: QuestionsRepo
  ): Promise<void> {
    // Validar opções da pergunta
    this.validateQuestionOptions(
      createQuestionDto.questionType,
      createQuestionDto.questionOptions
    )

    // Validar as validações da questão (se existirem)
    createQuestionDto.validations = await this.validateValidations(
      createQuestionDto.validations
    )
    // Validar regra de exibição
    await this.validateDisplayRule(createQuestionDto, questionsRepo)

    // Validar subQuestões
    await this.validateSubquestions(createQuestionDto)

    // Validar questionScore
    await this.validateQuestionScore(
      createQuestionDto.questionType,
      createQuestionDto.questionScore,
      createQuestionDto.questionOptions
    )
  }

  static async validateSubquestions(
    createQuestionDto: CreateQuestionDto | UpdateQuestionDto
  ) {
    if (
      (createQuestionDto.questionType as EQuestionsTypes) !==
      EQuestionsTypes.MULTIPLE_RESPONSES
    )
      return
    if (
      !createQuestionDto.subQuestions ||
      createQuestionDto.subQuestions.length === 0
    ) {
      throw new BadRequestException(
        '#Para perguntas de múltiplas respostas, é obrigatório informar subquestões'
      )
    }

    for (const subQuestion of createQuestionDto.subQuestions) {
      const subQuestionType = subQuestion.subQuestionType as EQuestionsTypes

      const allowableTypesForSubQuestions = [
        EQuestionsTypes.OPEN_ANSWER,
        EQuestionsTypes.DATE,
        EQuestionsTypes.TIME,
        EQuestionsTypes.SINGLE_CHOICE,
        EQuestionsTypes.MULTIPLE_CHOICE
      ]

      if (!allowableTypesForSubQuestions.includes(subQuestionType)) {
        throw new BadRequestException(
          `#Para perguntas de múltiplas respostas, subquestões do tipo escolhido não podem ser criadas`
        )
      }

      // validar subQuestionsOptions
      const questionOptionsDto: QuestionOptionDto[] | undefined =
        subQuestion.subQuestionOptions?.map((subQuestionOption) => {
          return {
            questionOptionType: subQuestionOption.questionOptionType,
            questionOptionValue: subQuestionOption.questionOptionValue
          }
        })

      this.validateQuestionOptions(subQuestionType, questionOptionsDto)

      subQuestion.subValidations = await this.validateValidations(
        subQuestion.subValidations
      )
    }
  }

  static async validateUpdateQuestion(
    updateQuestionDto: UpdateQuestionDto,
    questionsRepo: QuestionsRepo
  ): Promise<void> {
    // Buscar a pergunta existente
    const existingQuestion = await questionsRepo.findById(
      updateQuestionDto.questionId
    )
    if (!existingQuestion) {
      throw new BadRequestException('#Pergunta não encontrada')
    }

    // Verificar se a questão está sendo usada como emailQuestionId e se o tipo está mudando
    if (
      (existingQuestion.questionType as EQuestionsTypes) ===
        EQuestionsTypes.EMAIL &&
      (updateQuestionDto.questionType as EQuestionsTypes) !==
        EQuestionsTypes.EMAIL
    ) {
      const isUsedAsEmailQuestion =
        await questionsRepo.isQuestionUsedAsEmailQuestionId(
          updateQuestionDto.questionId
        )
      if (isUsedAsEmailQuestion) {
        throw new BadRequestException(
          '#Esta questão não pode ter seu tipo alterado porque está sendo utilizada como questão de email em um ou mais formulários.'
        )
      }
    }

    // Validar opções da pergunta
    this.validateQuestionOptions(
      updateQuestionDto.questionType,
      updateQuestionDto.questionOptions
    )

    // Validar questionScore
    await this.validateQuestionScore(
      updateQuestionDto.questionType,
      updateQuestionDto.questionScore,
      updateQuestionDto.questionOptions
    )
    // Validar as validações da questão (se existirem)
    updateQuestionDto.validations = await this.validateValidations(
      updateQuestionDto.validations
    )

    // Validar regra de exibição
    await this.validateDisplayRule(
      updateQuestionDto,
      questionsRepo,
      existingQuestion
    )

    // validar subQuestions
    await this.validateSubquestions(updateQuestionDto)
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
    const currentOrders = allSectionQuestions
      .map((q) => q.questionOrder)
      .sort((a, b) => a - b)
    const orders = questions.map((q) => q.questionOrder).sort((a, b) => a - b)

    const minorCurrentOrder = currentOrders[0]
    const majorCurrentOrder = currentOrders[currentOrders.length - 1]

    if (minorCurrentOrder >= majorCurrentOrder) {
      throw new InternalServerErrorException(
        '#Não foi possível identificar a ordenação atual das perguntas'
      )
    }

    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + minorCurrentOrder) {
        throw new BadRequestException(
          `#A ordenação deve ser sequencial, começando em ${minorCurrentOrder} até ${majorCurrentOrder}, sem saltos`
        )
      }
    }

    // Validação 3: Uma questão não pode ser movida para uma ordem anterior à de uma questão da qual depende
    for (const questionReorder of questions) {
      const currentQuestion = allQuestions.find(
        (q) => q.questionId === questionReorder.questionId
      )

      if (currentQuestion?.questionDisplayLink) {
        // Verificar se a questão referenciada é da mesma seção
        const referencedQuestion = allQuestions.find(
          (q) => q.questionId === currentQuestion.questionDisplayLink
        )

        if (referencedQuestion) {
          // Encontrar a nova ordem da questão referenciada no array
          const referencedQuestionNewOrder = questions.find(
            (q) => q.questionId === referencedQuestion.questionId
          )?.questionOrder

          if (
            referencedQuestionNewOrder &&
            questionReorder.questionOrder <= referencedQuestionNewOrder
          ) {
            throw new BadRequestException(
              `#A questão "${currentQuestion.questionStatement}" não pode ser movida para uma posição anterior ou igual à questão da qual depende (ordem ${referencedQuestionNewOrder})`
            )
          }
        }
      }
    }

    // Validação 4: Uma questão não pode ser movida para uma posição posterior à de uma questão que é sua dependente
    for (const questionReorder of questions) {
      const currentQuestion = allQuestions.find(
        (q) => q.questionId === questionReorder.questionId
      )

      // Verificar se alguma questão da mesma seção referencia esta questão
      const dependentQuestions = allQuestions.filter(
        (q) => q.questionDisplayLink === currentQuestion?.questionId
      )

      for (const dependentQuestion of dependentQuestions) {
        const dependentQuestionNewOrder = questions.find(
          (q) => q.questionId === dependentQuestion.questionId
        )?.questionOrder

        if (
          dependentQuestionNewOrder &&
          questionReorder.questionOrder >= dependentQuestionNewOrder
        ) {
          throw new BadRequestException(
            `#A questão "${currentQuestion?.questionStatement}" não pode ser movida para uma posição posterior ou igual à questão que depende dela: "${dependentQuestion.questionStatement}" (ordem ${dependentQuestionNewOrder})`
          )
        }
      }
    }
  }

  static async transformValidations(
    validations: Validation[]
  ): Promise<Validation[]> {
    if (!validations || validations.length === 0) {
      return []
    }

    const { VALIDATION_SPECIFICATIONS_BY_TYPE } = await import('./validations')

    return validations.map((validation) => {
      const spec = VALIDATION_SPECIFICATIONS_BY_TYPE[validation.validationType]
      if (!spec) {
        return validation
      }

      const transformedValidation = { ...validation }
      if (
        spec.valueOneType !== 'undefined' &&
        validation.valueOne !== undefined &&
        validation.valueOne !== null
      ) {
        transformedValidation.valueOne = this.convertValue(
          validation.valueOne,
          spec.valueOneType
        )
      }

      // Converter valueTwo
      if (
        spec.valueTwoType !== 'undefined' &&
        validation.valueTwo !== undefined &&
        validation.valueTwo !== null
      ) {
        transformedValidation.valueTwo = this.convertValue(
          validation.valueTwo,
          spec.valueTwoType
        )
      }

      // Converter valueThree
      if (
        spec.valueThreeType !== 'undefined' &&
        validation.valueThree !== undefined &&
        validation.valueThree !== null
      ) {
        transformedValidation.valueThree = this.convertValue(
          validation.valueThree,
          spec.valueThreeType
        )
      }

      // Converter valueFour
      if (
        spec.valueFourType !== 'undefined' &&
        validation.valueFour !== undefined &&
        validation.valueFour !== null
      ) {
        transformedValidation.valueFour = this.convertValue(
          validation.valueFour,
          spec.valueFourType
        )
      }

      return transformedValidation
    })
  }

  private static convertValue(value: string, targetType: string): any {
    if (value === undefined || value === null) {
      return undefined
    }

    switch (targetType) {
      case 'number': {
        const numValue = parseFloat(value)
        if (isNaN(numValue)) {
          throw new BadRequestException(
            `Valor '${value}' não pode ser convertido para número`
          )
        }
        return numValue
      }
      case 'boolean':
        if (value === 'true') return true
        if (value === 'false') return false
        throw new BadRequestException(
          `Valor '${value}' não pode ser convertido para boolean`
        )
      case 'string':
        return value
      default:
        return value
    }
  }

  private static async validateDisplayRule(
    createQuestionDto: CreateQuestionDto | UpdateQuestionDto,
    questionsRepo: QuestionsRepo,
    currentQuestion?: Question
  ) {
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

    let sectionId: number | undefined = undefined
    if (currentQuestion) {
      sectionId = currentQuestion.formSectionId
    } else if (
      'formSectionId' in createQuestionDto &&
      createQuestionDto.formSectionId
    ) {
      sectionId = createQuestionDto.formSectionId
    }

    if (sectionId === undefined) {
      throw new BadRequestException('#Seção inválida')
    }

    // Validar se a seção existe
    const section = await questionsRepo.findSectionById(sectionId)
    if (!section) {
      throw new BadRequestException('#Seção não encontrada')
    }

    // Validar se formSectionDisplayLink é válido (se fornecido)
    if (
      !createQuestionDto.formSectionDisplayLink ||
      !createQuestionDto.questionDisplayLink ||
      !createQuestionDto.answerDisplayRule ||
      !createQuestionDto.answerDisplayValue
    ) {
      return
    }

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

    const linkedQuestion = await questionsRepo.findById(
      createQuestionDto.questionDisplayLink
    )
    if (!linkedQuestion) {
      throw new BadRequestException('#Pergunta vinculada não encontrada')
    }

    let questionOrder: number | undefined = undefined
    if (currentQuestion) {
      questionOrder = currentQuestion.questionOrder
    } else if (
      'questionOrder' in createQuestionDto &&
      createQuestionDto.questionOrder
    ) {
      questionOrder = createQuestionDto.questionOrder
    }

    if (questionOrder === undefined) {
      throw new BadRequestException('#Ordem da pergunta inválida')
    }

    if (linkedQuestion.questionOrder >= questionOrder) {
      throw new BadRequestException(
        '#A pergunta vinculada na regra de exibição deve ter ordem menor que a pergunta que está sendo criada'
      )
    }

    // Validar se a regra de exibição da resposta é válida
    if (
      !Object.values(AnswersDisplayRules).includes(
        createQuestionDto.answerDisplayRule as AnswersDisplayRules
      )
    ) {
      throw new BadRequestException('#Regra de exibição de resposta inválida')
    }
  }

  private static async validateValidations(
    validations: Validation[] | undefined
  ): Promise<Validation[] | undefined> {
    if (!validations || validations.length === 0) {
      return
    }

    const { VALIDATION_SPECIFICATIONS_BY_TYPE } = await import('./validations')

    const tranformedValidations: Validation[] = validations.map(
      (validation) => {
        const spec =
          VALIDATION_SPECIFICATIONS_BY_TYPE[validation.validationType]
        if (!spec) {
          throw new BadRequestException(
            `#Validação de tipo ${validation.validationType} desconhecida`
          )
        }
        const valueTypes = [
          spec.valueOneType,
          spec.valueTwoType,
          spec.valueThreeType,
          spec.valueFourType
        ]

        const values = [
          validation.valueOne,
          validation.valueTwo,
          validation.valueThree,
          validation.valueFour
        ]
        for (let i = 0; i < valueTypes.length; i++) {
          const expectedType = valueTypes[i]
          const value = values[i]
          if (expectedType === 'undefined' && value !== undefined) {
            throw new BadRequestException(
              `#Validação '${spec.validationName}': valor ${i + 1} deve ser undefined, recebido: ${typeof value}`
            )
          }
          if (expectedType === 'number' && typeof value !== 'number') {
            throw new BadRequestException(
              `#Validação '${spec.validationName}': valor ${i + 1} deve ser um número, recebido: ${typeof value}`
            )
          }
          if (expectedType === 'string' && typeof value !== 'string') {
            throw new BadRequestException(
              `#Validação '${spec.validationName}': valor ${i + 1} deve ser um texto, recebido: ${typeof value}`
            )
          }
          if (expectedType === 'boolean' && typeof value !== 'boolean') {
            throw new BadRequestException(
              `#Validação '${spec.validationName}': valor ${i + 1} deve ser uma indicação de verdadeiro ou falso, recebido: ${typeof value}`
            )
          }
          // Após validar tipos, transformar todos os valores em string (exceto undefined)
        }
        return {
          ...validation,
          valueOne:
            validation.valueOne !== undefined && validation.valueOne !== null
              ? String(validation.valueOne)
              : undefined,
          valueTwo:
            validation.valueTwo !== undefined && validation.valueTwo !== null
              ? String(validation.valueTwo)
              : undefined,
          valueThree:
            validation.valueThree !== undefined &&
            validation.valueThree !== null
              ? String(validation.valueThree)
              : undefined,
          valueFour:
            validation.valueFour !== undefined && validation.valueFour !== null
              ? String(validation.valueFour)
              : undefined
        }
      }
    )

    return tranformedValidations
  }

  static async validateQuestionDeletion(
    questionId: number,
    questionsRepo: QuestionsRepo
  ): Promise<void> {
    // 1. Verificar se o ID da questão está sendo usado em alguma regra de display de seção
    const sectionsUsingQuestion =
      await questionsRepo.findSectionsUsingQuestionDisplayLink(questionId)

    if (sectionsUsingQuestion.length > 0) {
      const section = sectionsUsingQuestion[0]
      throw new BadRequestException(
        `#A questão não pode ser excluída porque está vinculada à seção "${section.formSectionName}" (ordem ${section.formSectionOrder}). Desfaça a vinculação antes de excluir a questão.`
      )
    }

    // 2. Verificar se o ID da questão está sendo usado em alguma regra de display de questão
    const questionsUsingQuestion =
      await questionsRepo.findQuestionsUsingQuestionDisplayLink(questionId)

    if (questionsUsingQuestion.length > 0) {
      const question = questionsUsingQuestion[0]
      throw new BadRequestException(
        `#A questão não pode ser excluída porque está vinculada à questão "${question.questionStatement}" (ordem ${question.questionOrder}). Desfaça a vinculação antes de excluir a questão.`
      )
    }
  }

  static validateQuestionOptions(
    questionType: number,
    questionOptions?: {
      questionOptionType: number
      questionOptionValue: string
    }[]
  ): void {
    // a) se a pergunta for do tipo "Resposta Aberta", "Data", "Hora" ou "Múltipla Resposta", as questionOptions devem não existir
    if (
      (questionType as EQuestionsTypes) === EQuestionsTypes.OPEN_ANSWER ||
      (questionType as EQuestionsTypes) === EQuestionsTypes.DATE ||
      (questionType as EQuestionsTypes) === EQuestionsTypes.TIME ||
      (questionType as EQuestionsTypes) ===
        EQuestionsTypes.MULTIPLE_RESPONSES ||
      (questionType as EQuestionsTypes) === EQuestionsTypes.EMAIL ||
      (questionType as EQuestionsTypes) === EQuestionsTypes.FIELDS
    ) {
      if (questionOptions && questionOptions.length > 0) {
        throw new BadRequestException(
          '#Perguntas do tipo Resposta Aberta, Data, Hora ou Múltipla Resposta não devem ter opções'
        )
      }
      return
    }

    // b) se for "Escolha Múltipla", "Escolha única", deve ter pelo menos 2 options do questionOptionsType 1 e 0 dos outros tipos
    if (
      (questionType as EQuestionsTypes) === EQuestionsTypes.MULTIPLE_CHOICE ||
      (questionType as EQuestionsTypes) === EQuestionsTypes.SINGLE_CHOICE ||
      (questionType as EQuestionsTypes) === EQuestionsTypes.LIKERT_SCALE
    ) {
      if (!questionOptions || questionOptions.length < 2) {
        throw new BadRequestException(
          '#Este tipo de pergunta deve ter pelo menos 2 opções'
        )
      }

      const type1Options = questionOptions.filter(
        (opt) =>
          (opt.questionOptionType as EQuestionOptionsTypes) ===
          EQuestionOptionsTypes.TYPE_ONE
      )
      const type2Options = questionOptions.filter(
        (opt) =>
          (opt.questionOptionType as EQuestionOptionsTypes) ===
          EQuestionOptionsTypes.TYPE_TWO
      )
      const type3Options = questionOptions.filter(
        (opt) =>
          (opt.questionOptionType as EQuestionOptionsTypes) ===
          EQuestionOptionsTypes.TYPE_THREE
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
      (questionType as EQuestionsTypes) ===
        EQuestionsTypes.SINGLE_CHOICE_MATRIX ||
      (questionType as EQuestionsTypes) ===
        EQuestionsTypes.MULTIPLE_CHOICE_MATRIX
    ) {
      if (!questionOptions || questionOptions.length < 4) {
        throw new BadRequestException(
          '#Este tipo de pergunta deve ter pelo menos 4 opções (2 do tipo 1 e 2 do tipo 2)'
        )
      }

      const type1Options = questionOptions.filter(
        (opt) =>
          (opt.questionOptionType as EQuestionOptionsTypes) ===
          EQuestionOptionsTypes.TYPE_ONE
      )
      const type2Options = questionOptions.filter(
        (opt) =>
          (opt.questionOptionType as EQuestionOptionsTypes) ===
          EQuestionOptionsTypes.TYPE_TWO
      )
      const type3Options = questionOptions.filter(
        (opt) =>
          (opt.questionOptionType as EQuestionOptionsTypes) ===
          EQuestionOptionsTypes.TYPE_THREE
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
      const groupedByType = questionOptions.reduce(
        (acc, option) => {
          if (!acc[option.questionOptionType]) {
            acc[option.questionOptionType] = []
          }
          acc[option.questionOptionType].push(option.questionOptionValue)
          return acc
        },
        {} as Record<number, string[]>
      )

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

  static async validateQuestionScore(
    questionType: number,
    questionScore: QuestionScoreDto | undefined,
    questionOptions?: QuestionOptionDto[]
  ): Promise<void> {
    // Se não há questionScore, não há o que validar
    if (!questionScore) {
      return
    }

    // QuestionScore só pode ser usado com SINGLE_CHOICE (3) ou DATE (7)
    if (
      (questionType as EQuestionsTypes) !== EQuestionsTypes.SINGLE_CHOICE &&
      (questionType as EQuestionsTypes) !== EQuestionsTypes.DATE
    ) {
      throw new BadRequestException(
        '#A pontuação de questão só pode ser definida para perguntas do tipo Escolha Única (SINGLE_CHOICE) ou Data (DATE)'
      )
    }

    // Validações específicas para OPTION_BASED
    if (
      questionScore.scoreType === EScoreType.OPTION_BASED &&
      (questionType as EQuestionsTypes) === EQuestionsTypes.SINGLE_CHOICE
    ) {
      if (!questionScore.optionScoresJson) {
        throw new BadRequestException(
          '#Para pontuação baseada em opções, optionScoresJson deve ser fornecido'
        )
      }

      // Verificar se todas as opções referenciadas existem pelo valor
      if (questionOptions && questionOptions.length > 0) {
        const optionValues = questionOptions.map(
          (opt) => opt.questionOptionValue
        )

        const scoreOptionValues = Object.keys(questionScore.optionScoresJson)

        for (const scoreOptionValue of scoreOptionValues) {
          if (!optionValues.includes(scoreOptionValue)) {
            throw new BadRequestException(
              `#A opção "${scoreOptionValue}" não existe nesta questão`
            )
          }
        }
      }
    }

    // Validações específicas para DATE_BASED
    if (
      questionScore.scoreType === EScoreType.DATE_BASED &&
      (questionType as EQuestionsTypes) === EQuestionsTypes.DATE
    ) {
      if (!questionScore.dateComparisonType) {
        throw new BadRequestException(
          '#Para pontuação baseada em data, dateComparisonType deve ser fornecido'
        )
      }

      if (!questionScore.cutoffDate) {
        throw new BadRequestException(
          '#Para pontuação baseada em data, cutoffDate deve ser fornecida'
        )
      }

      if (
        questionScore.dateScore === undefined ||
        questionScore.dateScore === null
      ) {
        throw new BadRequestException(
          '#Para pontuação baseada em data, dateScore deve ser fornecido'
        )
      }
    }
  }
}
