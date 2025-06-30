
import { CreateQuestion, Question, UpdateQuestion } from './types'
import { CreateQuestionDto } from './dto/create-question.dto'
import { UpdateQuestionDto } from './dto/update-question.dto'
import { FormSectionDisplayRules } from '../constants/form-section-display-rules.const'
import { BadRequestException } from '@nestjs/common'
import { QuestionsRepo } from './questions.repo'
import { FormSectionsRepo } from '../form-sections/form-sections.repo'

export class QuestionsHelper {
  static mapCreateDtoToEntity(dto: CreateQuestionDto): CreateQuestion {
    return {
      formSectionId: dto.formSectionId,
      questionName: dto.questionName,
      questionOrder: dto.questionOrder,
      questionDisplayRule: dto.questionDisplayRule,
      formSectionDisplayLink: dto.formSectionDisplayLink,
      questionDisplayLink: dto.questionDisplayLink,
      answerDisplayRule: dto.answerDisplayRule,
      answerDisplayValue: dto.answerDisplayValue ? dto.answerDisplayValue.join('|') : undefined
    }
  }

  static mapUpdateDtoToEntity(dto: UpdateQuestionDto): UpdateQuestion {
    return {
      questionId: dto.questionId,
      questionName: dto.questionName,
      questionDisplayRule: dto.questionDisplayRule,
      formSectionDisplayLink: dto.formSectionDisplayLink,
      questionDisplayLink: dto.questionDisplayLink,
      answerDisplayRule: dto.answerDisplayRule,
      answerDisplayValue: dto.answerDisplayValue ? dto.answerDisplayValue.join('|') : undefined
    }
  }

  static sortQuestionsByOrder(questions: Question[]): Question[] {
    return questions.sort((a, b) => a.questionOrder - b.questionOrder)
  }

  static validateDisplayRule(displayRule: number): boolean {
    return Object.values(FormSectionDisplayRules).includes(
      displayRule as FormSectionDisplayRules
    )
  }

  static validateDisplayRuleAndRequiredFields(
    displayRule: number,
    formSectionDisplayLink?: number,
    questionDisplayLink?: number,
    answerDisplayRule?: number,
    answerDisplayValue?: string[]
  ): void {
    if (!this.validateDisplayRule(displayRule)) {
      throw new BadRequestException('#Regra de exibição inválida')
    }

    if ((displayRule as FormSectionDisplayRules) === FormSectionDisplayRules.ALWAYS_SHOW) {
      if (formSectionDisplayLink || questionDisplayLink || answerDisplayRule || answerDisplayValue) {
        throw new BadRequestException(
          '#Quando a regra é "Sempre aparecer", não deve haver campos de exibição condicional'
        )
      }
    } else {
      if (!formSectionDisplayLink || !questionDisplayLink || !answerDisplayRule || !answerDisplayValue) {
        throw new BadRequestException(
          '#Quando a regra não é "Sempre aparecer", são obrigatórios: formSectionDisplayLink, questionDisplayLink, answerDisplayRule e answerDisplayValue'
        )
      }
    }
  }

  static processDisplayFields(
    displayRule: number,
    formSectionDisplayLink?: number,
    questionDisplayLink?: number,
    answerDisplayRule?: number,
    answerDisplayValue?: string[]
  ): {
    formSectionDisplayLink?: number
    questionDisplayLink?: number
    answerDisplayRule?: number
    answerDisplayValue?: string
  } {
    if ((displayRule as FormSectionDisplayRules) === FormSectionDisplayRules.ALWAYS_SHOW) {
      return {
        formSectionDisplayLink: undefined,
        questionDisplayLink: undefined,
        answerDisplayRule: undefined,
        answerDisplayValue: undefined
      }
    }

    return {
      formSectionDisplayLink,
      questionDisplayLink,
      answerDisplayRule,
      answerDisplayValue: answerDisplayValue ? answerDisplayValue.join('|') : undefined
    }
  }

  static async validateFormSectionDisplayLink(
    formSectionDisplayLink: number,
    questionFormSectionId: number,
    formSectionsRepo: FormSectionsRepo
  ): Promise<void> {
    const linkedSection = await formSectionsRepo.findById(formSectionDisplayLink)
    
    if (!linkedSection) {
      throw new BadRequestException('#Seção referenciada não encontrada')
    }

    const questionSection = await formSectionsRepo.findById(questionFormSectionId)
    
    if (!questionSection) {
      throw new BadRequestException('#Seção da pergunta não encontrada')
    }

    if (linkedSection.sFormId !== questionSection.sFormId) {
      throw new BadRequestException('#A seção referenciada deve ser do mesmo formulário')
    }

    if (linkedSection.formSectionOrder > questionSection.formSectionOrder) {
      throw new BadRequestException('#A seção referenciada deve ter ordem igual ou anterior')
    }
  }

  static async validateQuestionDisplayLink(
    questionDisplayLink: number,
    formSectionDisplayLink: number,
    questionFormSectionId: number,
    questionOrder: number,
    questionsRepo: QuestionsRepo
  ): Promise<void> {
    const linkedQuestion = await questionsRepo.findById(questionDisplayLink)
    
    if (!linkedQuestion) {
      throw new BadRequestException('#Pergunta referenciada não encontrada')
    }

    if (formSectionDisplayLink === questionFormSectionId) {
      if (linkedQuestion.questionOrder >= questionOrder) {
        throw new BadRequestException('#A pergunta referenciada deve ter ordem menor')
      }
    }

    if (linkedQuestion.formSectionId !== formSectionDisplayLink) {
      throw new BadRequestException('#A pergunta referenciada deve estar na seção especificada')
    }
  }

  static async processCreateQuestion(
    createQuestionDto: CreateQuestionDto,
    questionsRepo: QuestionsRepo,
    formSectionsRepo: FormSectionsRepo
  ): Promise<CreateQuestion> {
    // 1. Validar regra de exibição e campos obrigatórios
    this.validateDisplayRuleAndRequiredFields(
      createQuestionDto.questionDisplayRule,
      createQuestionDto.formSectionDisplayLink,
      createQuestionDto.questionDisplayLink,
      createQuestionDto.answerDisplayRule,
      createQuestionDto.answerDisplayValue
    )

    // 2. Se há campos de exibição condicional, validar
    if (createQuestionDto.formSectionDisplayLink) {
      await this.validateFormSectionDisplayLink(
        createQuestionDto.formSectionDisplayLink,
        createQuestionDto.formSectionId,
        formSectionsRepo
      )

      if (createQuestionDto.questionDisplayLink) {
        await this.validateQuestionDisplayLink(
          createQuestionDto.questionDisplayLink,
          createQuestionDto.formSectionDisplayLink,
          createQuestionDto.formSectionId,
          createQuestionDto.questionOrder,
          questionsRepo
        )
      }
    }

    // 3. Processar campos de exibição
    const processedFields = this.processDisplayFields(
      createQuestionDto.questionDisplayRule,
      createQuestionDto.formSectionDisplayLink,
      createQuestionDto.questionDisplayLink,
      createQuestionDto.answerDisplayRule,
      createQuestionDto.answerDisplayValue
    )

    return {
      ...this.mapCreateDtoToEntity(createQuestionDto),
      ...processedFields
    }
  }

  static async validateReorderData(
    questions: { questionId: number; questionOrder: number }[],
    questionsRepo: QuestionsRepo
  ): Promise<void> {
    if (questions.length === 0) {
      throw new BadRequestException('#Array de perguntas não pode estar vazio')
    }

    // Buscar todas as perguntas para validação
    const firstQuestionId = questions[0].questionId
    const firstQuestion = await questionsRepo.findById(firstQuestionId)

    if (!firstQuestion) {
      throw new BadRequestException('#Pergunta não encontrada')
    }

    const formSectionId = firstQuestion.formSectionId
    const allSectionQuestions = await questionsRepo.findAllByFormSectionId(formSectionId)

    // Validar se todas as perguntas são da mesma seção
    for (const question of questions) {
      const foundQuestion = allSectionQuestions.find(
        (q) => q.questionId === question.questionId
      )
      if (!foundQuestion) {
        throw new BadRequestException(
          '#Todas as perguntas devem pertencer à mesma seção'
        )
      }
    }

    // Validar se todas as perguntas da seção estão no array
    if (questions.length !== allSectionQuestions.length) {
      throw new BadRequestException(
        '#Todas as perguntas da seção devem estar presentes no array'
      )
    }

    // Validar se todos os IDs da seção estão no array
    const questionIds = questions
      .map((q) => q.questionId)
      .sort((a, b) => a - b)
    const sectionQuestionIds = allSectionQuestions
      .map((q) => q.questionId)
      .sort((a, b) => a - b)

    if (JSON.stringify(questionIds) !== JSON.stringify(sectionQuestionIds)) {
      throw new BadRequestException(
        '#Todas as perguntas da seção devem estar presentes no array'
      )
    }

    // Validar ordenação sequencial sem saltos nem repetições
    const orders = questions.map((q) => q.questionOrder).sort((a, b) => a - b)

    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        throw new BadRequestException(
          '#A ordenação deve ser sequencial, começando em 1, sem saltos ou repetições'
        )
      }
    }
  }
}
