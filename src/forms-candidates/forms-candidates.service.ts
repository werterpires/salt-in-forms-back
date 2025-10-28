import { Injectable, NotFoundException } from '@nestjs/common'
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

@Injectable()
export class FormsCandidatesService {
  constructor(
    private readonly formsCandidatesRepo: FormsCandidatesRepo,
    private readonly sendPulseEmailService: SendPulseEmailService,
    private readonly encryptionService: EncryptionService,
    private readonly logger: CustomLoggerService
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

    console.log('Hours difference:', hoursDifference)

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

      throw new Error(
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
}
