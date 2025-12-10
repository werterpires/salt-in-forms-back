import { Injectable, BadRequestException } from '@nestjs/common'
import { CreateQuestionDto } from './dto/create-question.dto'
import { ReorderQuestionsDto } from './dto/reorder-questions.dto'
import { UpdateQuestionDto } from './dto/update-question.dto'
import { QuestionsHelper } from './questions.helper'
import { QuestionsRepo } from './questions.repo'
import { AnswersRepo } from '../answers/answers.repo'
import { FormSectionsRepo } from '../form-sections/form-sections.repo'
import { Question } from './types'

@Injectable()
export class QuestionsService {
  constructor(
    private readonly questionsRepo: QuestionsRepo,
    private readonly answersRepo: AnswersRepo,
    private readonly formSectionsRepo: FormSectionsRepo
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<void> {
    // Verificar se o formulário (através da seção) já possui respostas
    const section = await this.formSectionsRepo.findById(
      createQuestionDto.formSectionId
    )
    if (section) {
      const hasAnswers = await this.answersRepo.hasAnswersForForm(
        section.sFormId
      )
      if (hasAnswers) {
        throw new BadRequestException(
          '#Não é possível adicionar perguntas pois este formulário já possui respostas de candidatos.'
        )
      }
    }

    const createQuestionData = await QuestionsHelper.transformCreateDto(
      createQuestionDto,
      this.questionsRepo
    )

    await this.questionsRepo.create(createQuestionData)
  }

  async findAllBySectionId(formSectionId: number): Promise<Question[]> {
    const questions = await this.questionsRepo.findAllBySectionId(formSectionId)

    for (const question of questions) {
      // Se o tipo da pergunta não for 1, 7 ou 8, busca as options
      if (
        question.questionType !== 1 &&
        question.questionType !== 7 &&
        question.questionType !== 8
      ) {
        question.questionOptions =
          await this.questionsRepo.findQuestionOptionsByQuestionId(
            question.questionId
          )
      }

      // Buscar e transformar validações para todas as questões
      const validations = await this.questionsRepo.findValidationsByQuestionId(
        question.questionId
      )
      question.validations =
        await QuestionsHelper.transformValidations(validations)

      // Buscar questionScore
      const questionScore =
        await this.questionsRepo.findQuestionScoreByQuestionId(
          question.questionId
        )
      if (questionScore) {
        question.questionScore = questionScore
      }

      // Buscar subQuestions
      const subQuestions =
        await this.questionsRepo.findSubQuestionsByQuestionId(
          question.questionId
        )

      if (subQuestions && subQuestions.length > 0) {
        question.subQuestions = []

        for (const subQuestion of subQuestions) {
          // Se o tipo da subquestão não for 1, 7 ou 8, busca as options
          if (
            subQuestion.subQuestionType !== 1 &&
            subQuestion.subQuestionType !== 7 &&
            subQuestion.subQuestionType !== 8
          ) {
            subQuestion.subQuestionOptions =
              await this.questionsRepo.findSubQuestionOptionsBySubQuestionId(
                subQuestion.subQuestionId
              )
          }

          // Buscar e transformar validações para a subquestão
          const subValidations =
            await this.questionsRepo.findSubValidationsBySubQuestionId(
              subQuestion.subQuestionId
            )
          subQuestion.subValidations =
            await QuestionsHelper.transformValidations(subValidations)

          question.subQuestions.push(subQuestion)
        }
      }
    }

    return questions
  }

  async update(updateQuestionDto: UpdateQuestionDto): Promise<void> {
    // Verificar se a questão já possui respostas
    const hasAnswers = await this.answersRepo.hasAnswersForQuestion(
      updateQuestionDto.questionId
    )
    if (hasAnswers) {
      throw new BadRequestException(
        '#Esta pergunta já possui respostas de candidatos e não pode ser editada.'
      )
    }

    const updateQuestionData = await QuestionsHelper.transformUpdateDto(
      updateQuestionDto,
      this.questionsRepo
    )

    // Use the new transaction-based update method
    await this.questionsRepo.updateQuestionWithOptions(
      updateQuestionData,
      updateQuestionData.questionOptions
    )
  }

  async delete(questionId: number): Promise<void> {
    // Verificar se a questão já possui respostas
    const hasAnswers = await this.answersRepo.hasAnswersForQuestion(questionId)
    if (hasAnswers) {
      throw new BadRequestException(
        '#Esta pergunta já possui respostas de candidatos e não pode ser removida.'
      )
    }

    // Validar se a questão pode ser excluída (verificar vínculos)
    await QuestionsHelper.validateQuestionDeletion(
      questionId,
      this.questionsRepo
    )

    await this.questionsRepo.deleteQuestionCompletely(questionId)
  }

  async reorder(reorderQuestionsDto: ReorderQuestionsDto): Promise<void> {
    // Verificar se alguma das questões já possui respostas
    for (const questionOrder of reorderQuestionsDto.questions) {
      const hasAnswers = await this.answersRepo.hasAnswersForQuestion(
        questionOrder.questionId
      )
      if (hasAnswers) {
        throw new BadRequestException(
          '#Não é possível reordenar perguntas pois algumas já possuem respostas de candidatos.'
        )
      }
    }

    await QuestionsHelper.validateReorderData(
      reorderQuestionsDto.questions,
      this.questionsRepo
    )
    return this.questionsRepo.reorderQuestions(reorderQuestionsDto.questions)
  }

  async getNumberOfQuestionsFromPreviousSections(
    formSectionId: number
  ): Promise<number> {
    return this.questionsRepo.getNumberOfQuestionsFromPreviousSections(
      formSectionId
    )
  }

  async findById(questionId: number): Promise<Question | null> {
    const question = await this.questionsRepo.findById(questionId)

    if (!question) {
      return null
    }

    if (
      question.questionType !== 1 &&
      question.questionType !== 7 &&
      question.questionType !== 8
    ) {
      question.questionOptions =
        await this.questionsRepo.findQuestionOptionsByQuestionId(
          question.questionId
        )
    }

    // Buscar e transformar validações
    const validations = await this.questionsRepo.findValidationsByQuestionId(
      question.questionId
    )
    question.validations =
      await QuestionsHelper.transformValidations(validations)

    // Buscar questionScore
    const questionScore =
      await this.questionsRepo.findQuestionScoreByQuestionId(
        question.questionId
      )
    if (questionScore) {
      question.questionScore = questionScore
    }

    // Buscar subQuestions
    const subQuestions = await this.questionsRepo.findSubQuestionsByQuestionId(
      question.questionId
    )

    if (subQuestions && subQuestions.length > 0) {
      question.subQuestions = []

      for (const subQuestion of subQuestions) {
        // Se o tipo da subquestão não for 1, 7 ou 8, busca as options
        if (
          subQuestion.subQuestionType !== 1 &&
          subQuestion.subQuestionType !== 7 &&
          subQuestion.subQuestionType !== 8
        ) {
          subQuestion.subQuestionOptions =
            await this.questionsRepo.findSubQuestionOptionsBySubQuestionId(
              subQuestion.subQuestionId
            )
        }

        // Buscar e transformar validações para a subquestão
        const subValidations =
          await this.questionsRepo.findSubValidationsBySubQuestionId(
            subQuestion.subQuestionId
          )
        subQuestion.subValidations =
          await QuestionsHelper.transformValidations(subValidations)

        question.subQuestions.push(subQuestion)
      }
    }

    return question
  }

  async findByIds(questionIds: number[]): Promise<Question[]> {
    const questions = await this.questionsRepo.findByIds(questionIds)

    for (const question of questions) {
      if (
        question.questionType !== 1 &&
        question.questionType !== 7 &&
        question.questionType !== 8
      ) {
        question.questionOptions =
          await this.questionsRepo.findQuestionOptionsByQuestionId(
            question.questionId
          )
      }

      // Buscar e transformar validações para todas as questões
      const validations = await this.questionsRepo.findValidationsByQuestionId(
        question.questionId
      )
      question.validations =
        await QuestionsHelper.transformValidations(validations)

      // Buscar questionScore
      const questionScore =
        await this.questionsRepo.findQuestionScoreByQuestionId(
          question.questionId
        )
      if (questionScore) {
        question.questionScore = questionScore
      }

      // Buscar subQuestions
      const subQuestions =
        await this.questionsRepo.findSubQuestionsByQuestionId(
          question.questionId
        )

      if (subQuestions && subQuestions.length > 0) {
        question.subQuestions = []

        for (const subQuestion of subQuestions) {
          // Se o tipo da subquestão não for 1, 7 ou 8, busca as options
          if (
            subQuestion.subQuestionType !== 1 &&
            subQuestion.subQuestionType !== 7 &&
            subQuestion.subQuestionType !== 8
          ) {
            subQuestion.subQuestionOptions =
              await this.questionsRepo.findSubQuestionOptionsBySubQuestionId(
                subQuestion.subQuestionId
              )
          }

          // Buscar e transformar validações para a subquestão
          const subValidations =
            await this.questionsRepo.findSubValidationsBySubQuestionId(
              subQuestion.subQuestionId
            )
          subQuestion.subValidations =
            await QuestionsHelper.transformValidations(subValidations)

          question.subQuestions.push(subQuestion)
        }
      }
    }

    return questions
  }
}
