import { BadRequestException, Injectable } from '@nestjs/common'
import { AnswersRepo } from './answers.repo'
import { CreateAnswerDto } from './dto/create-answer.dto'
import { FormsCandidatesService } from '../forms-candidates/forms-candidates.service'
import { FormsCandidatesRepo } from '../forms-candidates/forms-candidates.repo'
import { transformCreateAnswerDto } from '../forms-candidates/forms-candidates.helper'
import {
  Answer,
  CreateAnswer,
  QuestionDependent,
  DependentProcessingResult
} from './types'
import { AnswersHelper } from './answers.helper'
import { QuestionsRepo } from '../questions/questions.repo'
import { Question, Validation } from '../questions/types'
import { FormSectionsRepo } from '../form-sections/form-sections.repo'
import { EncryptionService } from '../shared/utils-module/encryption/encryption.service'

@Injectable()
export class AnswersService {
  constructor(
    private readonly answersRepo: AnswersRepo,
    private readonly formsCandidatesService: FormsCandidatesService,
    private readonly formsCandidatesRepo: FormsCandidatesRepo,
    private readonly questionsRepo: QuestionsRepo,
    private readonly formSectionsRepo: FormSectionsRepo,
    private readonly encryptionService: EncryptionService
  ) {}

  async createAnswer(
    createAnswerDto: CreateAnswerDto
  ): Promise<DependentProcessingResult[]> {
    const formCandidateId: number =
      await this.formsCandidatesService.validateAccessCodeAndGetFormCandidateId(
        createAnswerDto.accessCode
      )

    // Validar período de resposta e status do formulário
    const currentStatus =
      await this.formsCandidatesService.validateFormCandidateForAnswer(
        formCandidateId
      )

    // Primeira validação: verificar se já existe answer e se está habilitada
    const existingAnswerEncrypted: Answer | undefined =
      await this.answersRepo.findAnswerByQuestionAndFormCandidate(
        createAnswerDto.questionId,
        formCandidateId
      )

    const existingAnswer: Answer | undefined = AnswersHelper.decryptAnswer(
      existingAnswerEncrypted,
      this.encryptionService
    )

    if (existingAnswer && !existingAnswer.validAnswer) {
      throw new BadRequestException(
        '#Essa questão não está habilitada para respostas desse usuário.'
      )
    }

    const question: Question | null = await this.questionsRepo.findById(
      createAnswerDto.questionId
    )

    if (!question) {
      throw new BadRequestException('#Pergunta não encontrada.')
    }

    const questionValidations: Validation[] =
      await this.questionsRepo.findValidationsByQuestionId(question.questionId)

    const validValidations: Validation[] = AnswersHelper.filterValidValidations(
      questionValidations,
      question.questionType
    )

    // Buscar candidateId para validação de email único
    const candidateId =
      await this.formsCandidatesRepo.findCandidateIdByFormCandidateId(
        formCandidateId
      )

    if (!candidateId) {
      throw new BadRequestException('#Candidato não encontrado.')
    }

    // Verificar se há validação de email único
    const hasEmailUniqueValidation = validValidations.some(
      (validation) => validation.validationType === 27
    )

    if (hasEmailUniqueValidation && question.questionType === 10) {
      // Usar validação com verificação de email único
      await AnswersHelper.validateAnswerWithEmailUniqueness(
        createAnswerDto.answerValue,
        validValidations,
        question.questionType,
        candidateId,
        formCandidateId,
        this.answersRepo,
        this.encryptionService
      )
    } else {
      // Usar validação normal
      AnswersHelper.validateAnswer(
        createAnswerDto.answerValue,
        validValidations
      )
    }

    // Buscar dependentes da questão
    const sectionsUsingQuestion =
      await this.formSectionsRepo.findSectionsUsingQuestionDisplayLink(
        question.questionId
      )

    const questionsUsingQuestion =
      await this.questionsRepo.findQuestionsUsingQuestionDisplayLink(
        question.questionId
      )

    // Buscar todas as questões das seções que referenciam questionA
    const questionsFromSections: Question[] = []
    for (const section of sectionsUsingQuestion) {
      const sectionQuestions = await this.questionsRepo.findAllBySectionId(
        section.formSectionId
      )
      questionsFromSections.push(...sectionQuestions)
    }

    const dependents: QuestionDependent[] = AnswersHelper.buildDependentsArray(
      sectionsUsingQuestion,
      questionsFromSections,
      questionsUsingQuestion
    )

    // Processar dependentes e salvar tudo em uma transação

    const response = await this.answersRepo.knex.transaction(async (trx) => {
      // Criptografar o answerValue usando helper
      const encryptedAnswerValue: string = AnswersHelper.encryptAnswerValue(
        createAnswerDto.answerValue,
        this.encryptionService
      )

      // 1. Salvar ou atualizar a resposta principal
      if (!existingAnswer) {
        const answerData: CreateAnswer = transformCreateAnswerDto(
          createAnswerDto,
          formCandidateId
        )
        answerData.answerValue = encryptedAnswerValue
        await this.answersRepo.insertAnswerInTransaction(answerData, trx)
      } else {
        await this.answersRepo.updateAnswerValueInTransaction(
          existingAnswer.answerId,
          encryptedAnswerValue,
          trx
        )
      }

      // 2. Processar dependentes
      const results: DependentProcessingResult[] = []

      // Avaliar a validade de cada dependente
      const dependentsToProcess = dependents
        .map((dep) =>
          AnswersHelper.processDependentValidity(
            createAnswerDto.answerValue,
            dep
          )
        )
        .filter((result) => result.shouldProcess)

      if (dependentsToProcess.length <= 0) {
        return results
      }

      // Buscar answers existentes dos dependentes
      const questionIds = dependentsToProcess.map((d) => d.questionId)
      const existingDependentAnswersEncrypted: Answer[] =
        await this.answersRepo.findAnswersByQuestionsAndFormCandidate(
          questionIds,
          formCandidateId,
          trx
        )

      const existingDependentAnswers: Answer[] = AnswersHelper.decryptAnswers(
        existingDependentAnswersEncrypted,
        this.encryptionService
      )

      // Criar mapa de answers existentes
      const answersMap = new Map<number, Answer>()
      existingDependentAnswers.forEach((answer) => {
        answersMap.set(answer.questionId, answer)
      })

      // Processar cada dependente
      for (const depResult of dependentsToProcess) {
        const existingDepAnswer = answersMap.get(depResult.questionId)

        if (existingDepAnswer) {
          // Atualizar validAnswer se necessário
          if (existingDepAnswer.validAnswer !== depResult.validAnswer) {
            await this.answersRepo.updateAnswerValidAnswer(
              existingDepAnswer.answerId,
              depResult.validAnswer,
              trx
            )
          }
        } else {
          // Criar nova answer
          const newAnswer: CreateAnswer = {
            questionId: depResult.questionId,
            formCandidateId: formCandidateId,
            answerValue: '',
            validAnswer: depResult.validAnswer
          }
          await this.answersRepo.insertAnswerInTransaction(newAnswer, trx)
        }

        results.push({
          questionId: depResult.questionId,
          validAnswer: depResult.validAnswer
        })
      }

      return results
    })

    // Se o status for menor que STARTED (4), atualizar para STARTED
    await this.formsCandidatesService.updateToStartedIfNeeded(
      formCandidateId,
      currentStatus
    )

    return response
  }
}
