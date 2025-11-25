import { EmailTemplateBuilder } from '../../utils-module/email-sender/email-template.builder'

/**
 * Template de email para notificar usuário sobre redefinição de senha e desativação da conta
 *
 * @param userName - Nome do usuário
 * @param timestamp - Data e hora da alteração
 * @returns HTML do email formatado
 */
export function getPasswordResetSuccessEmailTemplate(
  userName: string,
  timestamp: string
): string {
  const contentBeforeButton = [
    'Sua senha foi <strong>redefinida com sucesso</strong>.',
    '<div style="margin: 30px 0; padding: 20px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">',
    '<p style="margin: 0 0 10px 0; color: #92400e; font-weight: 600;">🔒 Conta Desativada por Segurança</p>',
    '<p style="margin: 0; color: #78350f; font-size: 14px;">Por medida de segurança, sua conta foi <strong>desativada automaticamente</strong>.</p>',
    '</div>',
    '<strong>Próximos Passos:</strong>',
    '• Entre em contato com um <strong>administrador do sistema</strong>',
    '• Solicite a <strong>reativação da sua conta</strong>',
    '• Será necessário validar sua identidade presencialmente',
    '',
    `<p style="font-size: 12px; color: #6b7280; margin-top: 20px;">Data e hora da alteração: <strong>${timestamp}</strong></p>`
  ]

  const infoText = [
    '<strong>⚠️ Não Reconhece Esta Ação?</strong>',
    'Se você <strong>não realizou</strong> esta alteração de senha, entre em contato <strong>imediatamente</strong> com um administrador.',
    'Sua conta já está desativada, portanto ninguém pode acessá-la até que seja reativada por um administrador.',
    '',
    'Por favor, não responda a este email.',
    'Em caso de dúvidas, entre em contato com o suporte.'
  ]

  return EmailTemplateBuilder.build({
    recipientName: userName,
    contentBeforeButton,
    contentAfterButton: [],
    infoText
  })
}
