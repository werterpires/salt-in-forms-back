import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { FormsCandidatesRepo } from './forms-candidates.repo'
import { SendPulseEmailService } from '../shared/utils-module/email-sender/sendpulse-email.service'
import { EncryptionService } from '../shared/utils-module/encryption/encryption.service'
import { CustomLoggerService } from '../shared/utils-module/custom-logger/custom-logger.service'
import {
  extractDateFromFixed,
  getHoursDifference,
  createAccessCode,
  prepareCandidateEmailData,
  getFrontendUrl
} from '../candidates/candidates.helper'
import { getResendAccessCodeEmailTemplate } from '../candidates/email-templates/resend-access-code.template'
import { FormCandidateStatus } from '../constants/form-candidate-status.const'
import { QuestionsRepo } from '../questions/questions.repo'
import { AnswersRepo } from '../answers/answers.repo'
import { AnswersHelper } from '../answers/answers.helper'
import { Question, Validation } from '../questions/types'
import { Answer } from '../answers/types'

@Injectable()
export class FormsCandidatesService {
  constructor(
    private readonly formsCandidatesRepo: FormsCandidatesRepo,
    private readonly sendPulseEmailService: SendPulseEmailService,
    private readonly encryptionService: EncryptionService,
    private readonly logger: CustomLoggerService,
    private readonly questionsRepo: QuestionsRepo,
    private readonly answersRepo: AnswersRepo
  ) {}

  /**
   * Valida código de acesso e retorna formCandidateId
   * Se expirado, gera novo código e reenvia email
   */
  async validateAccessCodeAndGetFormCandidateId(
    accessCode: string
  ): Promise<number> {
    const formCandidate =
      await this.formsCandidatesRepo.findFormCandidateByAccessCode(accessCode)

    if (!formCandidate) {
      throw new NotFoundException('#Código de acesso não encontrado.')
    }

    const createdAt = extractDateFromFixed(
      formCandidate.formCandidateAccessCode
    )
    const now = new Date()
    const hoursDifference = getHoursDifference(createdAt, now)

    if (Number.isNaN(hoursDifference) || hoursDifference > 24) {
      const newAccessCode = createAccessCode()
      await this.formsCandidatesRepo.updateAccessCode(
        formCandidate.formCandidateId,
        newAccessCode
      )

      await this.resendAccessCodeEmail(
        formCandidate.candidateId,
        formCandidate.sFormId,
        newAccessCode
      )

      throw new BadRequestException(
        '#O período de acesso expirou. Um novo código foi gerado e enviado por email.'
      )
    }

    return formCandidate.formCandidateId
  }

  private async resendAccessCodeEmail(
    candidateId: number,
    sFormId: number,
    accessCode: string
  ): Promise<void> {
    const frontendUrl = getFrontendUrl()

    const formData =
      await this.formsCandidatesRepo.findCandidateAndFormDataForResend(
        candidateId,
        sFormId
      )

    if (!formData) {
      this.logger.error(
        `#Dados não encontrados para candidateId: ${candidateId}, sFormId: ${sFormId}`
      )
      return
    }

    const { sFormType, candidateName, candidateEmail } = formData

    if (sFormType === 'candidate') {
      const { recipientName, recipientEmail, html } = prepareCandidateEmailData(
        candidateName,
        candidateEmail,
        accessCode,
        frontendUrl,
        this.encryptionService,
        getResendAccessCodeEmailTemplate
      )

      await this.sendPulseEmailService.sendEmail(
        recipientEmail,
        recipientName,
        html
      )

      this.logger.info(
        `Email de reenvio enviado para ${recipientName} (${recipientEmail})`
      )
    }
  }

  /**
   * Submete o formulário alterando o status para SUBMITTED
   * Valida o código de acesso antes de submeter e verifica se todas as questões obrigatórias foram respondidas
   */
  async submitForm(accessCode: string): Promise<void> {
    const formCandidateId =
      await this.validateAccessCodeAndGetFormCandidateId(accessCode)

    // Validar se ainda estamos no período de resposta antes de submeter
    await this.validateFormCandidateForAnswer(formCandidateId)

    // 1. Buscar todas as questões do form
    const questionIds: number[] =
      await this.formsCandidatesRepo.findAllQuestionsByFormCandidateId(
        formCandidateId
      )

    if (questionIds.length === 0) {
      throw new BadRequestException(
        '#Nenhuma questão encontrada no formulário.'
      )
    }

    // 2. Buscar todas as respostas do formCandidate (criptografadas)
    const answersEncrypted: Answer[] =
      await this.answersRepo.findAllAnswersByFormCandidateId(formCandidateId)

    // Descriptografar as respostas
    const answers: Answer[] = AnswersHelper.decryptAnswers(
      answersEncrypted,
      this.encryptionService
    )

    // 3. Criar mapa de respostas por questionId
    const answersByQuestionId = new Map<number, Answer>()
    answers.forEach((answer) => {
      answersByQuestionId.set(answer.questionId, answer)
    })

    // 4. Buscar os detalhes de todas as questões
    const questions: Question[] =
      await this.questionsRepo.findByIds(questionIds)

    // 5. Criar mapa de questões por ID para acesso rápido
    const questionsMap = new Map<number, Question>()
    questions.forEach((question) => {
      questionsMap.set(question.questionId, question)
    })

    // 6. Validar que cada questão possui resposta e validar as respostas
    let questionOrder = 0
    for (const questionId of questionIds) {
      questionOrder++
      const answer = answersByQuestionId.get(questionId)

      // Verificar se a questão existe
      if (!answer) {
        throw new BadRequestException(
          `#Por favor, confira a pergunta número ${questionOrder}.`
        )
      }

      // 7. Se validAnswer é true, validar a resposta contra as validations
      if (answer.validAnswer) {
        const question = questionsMap.get(questionId)

        if (!question) {
          throw new BadRequestException(
            `#Pergunta ${questionOrder} não encontrada no sistema.`
          )
        }

        // Buscar validações da questão
        const validations: Validation[] =
          await this.questionsRepo.findValidationsByQuestionId(questionId)

        // Filtrar validações válidas para o tipo de questão
        const validValidations: Validation[] =
          AnswersHelper.filterValidValidations(
            validations,
            question.questionType
          )

        // Se a resposta estiver vazia e há validações, é um erro
        if (answer.answerValue == null) {
          throw new BadRequestException(
            `#Por favor, confira a pergunta número ${questionOrder}.`
          )
        }

        // Validar a resposta apenas se houver valor

        try {
          AnswersHelper.validateAnswer(answer.answerValue, validValidations)
        } catch {
          throw new BadRequestException(
            `#Por favor, confira a pergunta número ${questionOrder}.`
          )
        }
      }
    }

    // 8. Se passou por todas as validações, atualizar status para SUBMITTED
    await this.formsCandidatesRepo.updateFormCandidateStatus(
      formCandidateId,
      FormCandidateStatus.SUBMITTED
    )

    this.logger.info(
      `Formulário submetido com sucesso. FormCandidateId: ${formCandidateId}`
    )
  }

  /**
   * Valida se o formulário ainda está no período de resposta e se o status permite receber respostas
   * @returns formCandidateStatus atual
   */
  async validateFormCandidateForAnswer(
    formCandidateId: number
  ): Promise<number> {
    const formData =
      await this.formsCandidatesRepo.findFormCandidateWithProcessDetails(
        formCandidateId
      )

    if (!formData) {
      throw new NotFoundException('#Formulário ou processo não encontrado.')
    }

    // Validação 1: Verificar período de resposta
    if (formData.processEndAnswers) {
      const now = new Date()
      const endAnswers = new Date(formData.processEndAnswers)

      if (now > endAnswers) {
        throw new BadRequestException(
          '#O período para responder este formulário já expirou.'
        )
      }
    }

    // Validação 2: Verificar status (se > 4, já foi submetido)
    if (
      (formData.formCandidateStatus as FormCandidateStatus) >
      FormCandidateStatus.STARTED
    ) {
      throw new BadRequestException(
        '#Este formulário já foi submetido e não pode mais receber respostas.'
      )
    }

    return formData.formCandidateStatus
  }

  /**
   * Atualiza o status do formCandidate para STARTED se ainda não estiver
   */
  async updateToStartedIfNeeded(
    formCandidateId: number,
    currentStatus: number
  ): Promise<void> {
    if (currentStatus < Number(FormCandidateStatus.STARTED)) {
      await this.formsCandidatesRepo.updateFormCandidateStatus(
        formCandidateId,
        FormCandidateStatus.STARTED
      )
    }
  }
}
