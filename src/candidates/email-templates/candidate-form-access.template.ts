import { EmailTemplateBuilder } from 'src/shared/utils-module/email-sender/email-template.builder'

/**
 * Template de email para acesso ao formulário do tipo "candidate"
 *
 * @param candidateName - Nome do candidato
 * @param accessLink - Link de acesso ao formulário
 * @param accessCode - Código de acesso
 * @returns HTML do email formatado
 */
export function getCandidateFormAccessEmailTemplate(
  candidateName: string,
  accessLink: string,
  accessCode: string
): string {
  const contentBeforeButton = [
    'Você está recebendo este e-mail para acessar o formulário de inscrição do vestibular do FAAMA.',
    'Por favor, clique no botão abaixo para preencher seu formulário.'
  ]

  const contentAfterButton = [
    `<strong>Código de Acesso:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 16px;">${accessCode}</code>`,
    '<strong>Importante:</strong> Este código de acesso é válido por 24 horas. Caso expire, um novo código será gerado automaticamente.'
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
