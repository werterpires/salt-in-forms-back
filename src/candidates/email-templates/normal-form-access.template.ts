import { EmailTemplateBuilder } from 'src/shared/utils-module/email-sender/email-template.builder'

/**
 * Template de email para acesso ao formulário do tipo "normal"
 *
 * @param recipientName - Nome do destinatário
 * @param candidateName - Nome do candidato que solicitou o formulário
 * @param accessLink - Link de acesso ao formulário
 * @param accessCode - Código de acesso
 * @returns HTML do email formatado
 */
export function getNormalFormAccessEmailTemplate(
  recipientName: string,
  candidateName: string,
  accessLink: string,
  accessCode: string
): string {
  const contentBeforeButton = [
    `Você está recebendo este e-mail porque foi indicado(a) por <strong>${candidateName}</strong> no processo de inscrição do vestibular do FAAMA.`,
    'Por favor, clique no botão abaixo para preencher o formulário solicitado.'
  ]

  const contentAfterButton = [
    `<strong>Código de Acesso:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 16px;">${accessCode}</code>`,
    '<strong>Importante:</strong> Este código de acesso é válido por 24 horas. Caso expire, um novo código será gerado automaticamente.',
    `Este formulário é parte do processo de avaliação de <strong>${candidateName}</strong>. Sua contribuição é fundamental para a análise do candidato.`
  ]

  return EmailTemplateBuilder.build({
    recipientName,
    contentBeforeButton,
    button: {
      text: 'Acessar Formulário',
      url: accessLink
    },
    contentAfterButton
  })
}
