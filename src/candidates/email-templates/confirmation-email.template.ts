import { EmailTemplateBuilder } from 'src/shared/utils-module/email-sender/email-template.builder'

/**
 * Template de email para confirmação de cadastro
 *
 * @param candidateName - Nome do candidato
 * @param confirmationLink - Link de confirmação com token
 * @param expiresInMinutes - Tempo de expiração em minutos (padrão: 60)
 * @returns HTML do email formatado
 */
export function getConfirmationEmailTemplate(
  candidateName: string,
  confirmationLink: string,
  expiresInMinutes = 60
): string {
  const contentBeforeButton = [
    'Obrigado por se cadastrar no processo seletivo do FAAMA!',
    'Para concluir seu cadastro, precisamos confirmar seu endereço de email.',
    'Por favor, clique no botão abaixo para confirmar:'
  ]

  const contentAfterButton = [
    `<strong>Importante:</strong> Este link é válido por ${expiresInMinutes} minutos.`,
    'Se você não solicitou este cadastro, ignore este email.'
  ]

  return EmailTemplateBuilder.build({
    recipientName: candidateName,
    contentBeforeButton,
    button: {
      text: 'Confirmar Email',
      url: confirmationLink
    },
    contentAfterButton
  })
}
