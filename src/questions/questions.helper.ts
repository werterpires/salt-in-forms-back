import { BadRequestException } from '@nestjs/common'
import { CreateQuestion, UpdateQuestion } from './types'
import { FormSectionDisplayRules } from '../constants/form-section-display-rules.const'
import { QuestionsRepo } from './questions.repo'
import { CreateQuestionDto } from './dto/create-question.dto'
import { UpdateQuestionDto } from './dto/update-question.dto'
import { AnswersDisplayRules } from 'src/constants/answer_display_rule'

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
}
