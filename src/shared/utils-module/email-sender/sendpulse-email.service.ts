
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { EmailSender } from './email-sender.interface'
import { SendPulseService } from '../sendpulse/sendpulse.service'
import { CustomLoggerService } from '../custom-logger/custom-logger.service'

@Injectable()
export class SendPulseEmailService implements EmailSender {
  private readonly senderName: string
  private readonly senderEmail: string
  private readonly emailSubject: string

  constructor(
    private readonly sendPulseService: SendPulseService,
    private readonly logger: CustomLoggerService
  ) {
    this.logger.setContext('SendPulseEmailService')

    if (!process.env.EMAIL_SENDER_NAME) {
      throw new InternalServerErrorException(
        'EMAIL_SENDER_NAME não está definido no .env'
      )
    }
    if (!process.env.EMAIL_SENDER_EMAIL) {
      throw new InternalServerErrorException(
        'EMAIL_SENDER_EMAIL não está definido no .env'
      )
    }
    if (!process.env.EMAIL_SUBJECT) {
      throw new InternalServerErrorException(
        'EMAIL_SUBJECT não está definido no .env'
      )
    }

    this.senderName = process.env.EMAIL_SENDER_NAME
    this.senderEmail = process.env.EMAIL_SENDER_EMAIL
    this.emailSubject = process.env.EMAIL_SUBJECT
  }

  async sendEmail(recipient: string, body: string): Promise<void> {
    try {
      this.logger.log(`Enviando e-mail para ${recipient}`)

      const emailData = {
        email: {
          html: Buffer.from(body).toString('base64'),
          subject: this.emailSubject,
          from: {
            name: this.senderName,
            email: this.senderEmail
          },
          to: [
            {
              name: recipient.split('@')[0],
              email: recipient
            }
          ]
        }
      }

      await this.sendPulseService.makeAuthenticatedRequest(
        '/smtp/emails',
        'POST',
        emailData
      )

      this.logger.log(`E-mail enviado com sucesso para ${recipient}`)
    } catch (error) {
      this.logger.error(
        `Erro ao enviar e-mail para ${recipient}`,
        error.stack
      )
      throw new InternalServerErrorException('Falha ao enviar e-mail')
    }
  }
}
