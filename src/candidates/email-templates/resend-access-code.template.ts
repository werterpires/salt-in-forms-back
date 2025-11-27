import { EmailTemplateBuilder } from 'src/shared/utils-module/email-sender/email-template.builder'

/**
 * Template de email para reenvio de código de acesso expirado
 *
 * @param candidateName - Nome do candidato
 * @param accessLink - Link de acesso ao formulário
 * @param accessCode - Novo código de acesso
 * @returns HTML do email formatado
 */
export function getResendAccessCodeEmailTemplate(
  candidateName: string,
  accessLink: string,
  accessCode: string
): string {
  const contentBeforeButton = [
    'Seu código de acesso anterior expirou. Geramos um novo código para você acessar o formulário de inscrição.'
  ]

  const contentAfterButton = [
    `<strong>Novo Código de Acesso:</strong> <code style="background: #fef3c7; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 16px; color: #78350f;">${accessCode}</code>`,
    '<strong>Importante:</strong> Este novo código também é válido por 24 horas.'
  ]

  return EmailTemplateBuilder.build({
    recipientName: candidateName,
    contentBeforeButton,
    button: {
      text: 'Acessar Formulário',
      url: accessLink
    },
    contentAfterButton
  })
}
