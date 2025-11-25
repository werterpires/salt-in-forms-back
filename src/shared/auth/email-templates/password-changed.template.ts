import { EmailTemplateBuilder } from '../../utils-module/email-sender/email-template.builder'

/**
 * Template de email para notificar usuário sobre alteração de senha (usuário logado)
 *
 * @param userName - Nome do usuário
 * @param timestamp - Data e hora da alteração
 * @returns HTML do email formatado
 */
export function getPasswordChangedEmailTemplate(
  userName: string,
  timestamp: string
): string {
  const contentBeforeButton = [
    'Sua senha foi <strong>alterada com sucesso</strong>.',
    '<div style="margin: 30px 0; padding: 20px; background: #d1fae5; border-left: 4px solid #10b981; border-radius: 4px;">',
    '<p style="margin: 0 0 10px 0; color: #065f46; font-weight: 600;">✓ Alteração Confirmada</p>',
    '<p style="margin: 0; color: #047857; font-size: 14px;">Esta alteração foi realizada com você <strong>autenticado</strong> no sistema.</p>',
    '</div>',
    `<p style="font-size: 12px; color: #6b7280; margin-top: 20px;">Data e hora da alteração: <strong>${timestamp}</strong></p>`
  ]

  const infoText = [
    '<strong>⚠️ Não Reconhece Esta Ação?</strong>',
    'Se você <strong>não realizou</strong> esta alteração de senha, sua conta pode estar comprometida.',
    'Ações recomendadas:',
    '• Entre em contato <strong>imediatamente</strong> com um administrador',
    '• Solicite o bloqueio temporário da sua conta',
    '• Verifique se há atividades suspeitas recentes',
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
