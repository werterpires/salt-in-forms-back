
import { Injectable } from '@nestjs/common'
import { AnswersRepo } from './answers.repo'
import { CandidatesRepo } from '../candidates/candidates.repo'
import { CreateAnswerDto } from './dto/create-answer.dto'
import { CreateAnswer } from './types'
import {
  extractDateFromFixed,
  getHoursDifference,
  createAccessCode,
  prepareCandidateEmailData,
  getFrontendUrl
} from '../candidates/candidates.helper'
import { SendPulseEmailService } from '../shared/utils-module/email-sender/sendpulse-email.service'
import { EncryptionService } from '../shared/utils-module/encryption/encryption.service'
import { CustomLoggerService } from '../shared/utils-module/custom-logger/custom-logger.service'
import { getResendAccessCodeEmailTemplate } from '../candidates/email-templates/resend-access-code.template'

@Injectable()
export class AnswersService {
  constructor(
    private readonly answersRepo: AnswersRepo,
    private readonly candidatesRepo: CandidatesRepo,
    private readonly sendPulseEmailService: SendPulseEmailService,
    private readonly encryptionService: EncryptionService,
    private readonly logger: CustomLoggerService
  ) {}

  async createAnswer(createAnswerDto: CreateAnswerDto): Promise<number> {
    const formCandidate =
      await this.candidatesRepo.findFormCandidateByAccessCode(
        createAnswerDto.accessCode
      )

    if (!formCandidate) {
      throw new Error('#Código de acesso não encontrado.')
    }

    const createdAt = extractDateFromFixed(
      formCandidate.formCandidateAccessCode
    )
    const now = new Date()
    const hoursDifference = getHoursDifference(createdAt, now)

    if (Number.isNaN(hoursDifference) || hoursDifference > 24) {
      const newAccessCode = createAccessCode()
      await this.candidatesRepo.updateAccessCode(
        formCandidate.formCandidateId,
        newAccessCode
      )

      await this.resendAccessCodeEmail(
        formCandidate.candidateId,
        formCandidate.sFormId,
        newAccessCode
      )

      throw new Error(
        '#O período de acesso expirou. Um novo código foi gerado e enviado por email.'
      )
    }

    const answerData: CreateAnswer = {
      questionId: createAnswerDto.questionId,
      formCandidateId: formCandidate.formCandidateId,
      answerValue: createAnswerDto.answerValue,
      validAnswer: createAnswerDto.validAnswer
    }

    return await this.answersRepo.insertAnswer(answerData)
  }

  private async resendAccessCodeEmail(
    candidateId: number,
    sFormId: number,
    accessCode: string
  ): Promise<void> {
    const frontendUrl = getFrontendUrl()

    const formData =
      await this.candidatesRepo.findCandidateAndFormDataForResend(
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
      const { recipientName, recipientEmail, html } =
        prepareCandidateEmailData(
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
}
