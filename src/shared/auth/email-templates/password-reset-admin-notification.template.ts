import { EmailTemplateBuilder } from '../../utils-module/email-sender/email-template.builder'

/**
 * Template de email para notificar administradores sobre recuperação de senha
 *
 * @param adminName - Nome do administrador
 * @param userEmail - Email do usuário que redefiniu a senha
 * @param timestamp - Data e hora da alteração
 * @returns HTML do email formatado
 */
export function getPasswordResetAdminNotificationEmailTemplate(
  adminName: string,
  userEmail: string,
  timestamp: string
): string {
  const contentBeforeButton = [
    ' <strong>Notificação de Segurança</strong>',
    '',
    'Um usuário realizou recuperação de senha através do sistema.',
    '<div style="margin: 30px 0; padding: 20px; background: #f3f4f6; border-radius: 8px;">',
    `<p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;"><strong>Usuário:</strong> ${userEmail}</p>`,
    `<p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;"><strong>Ação:</strong> Redefinição de senha via recuperação</p>`,
    `<p style="margin: 0; color: #374151; font-size: 14px;"><strong>Data/Hora:</strong> ${timestamp}</p>`,
    '</div>',
    '<div style="margin: 20px 0; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">',
    '<p style="margin: 0; color: #78350f; font-size: 14px;">A conta deste usuário foi <strong>desativada automaticamente</strong> por segurança.</p>',
    '</div>',
    '<strong>Próximos Passos:</strong>',
    '• O usuário deverá solicitar reativação da conta',
    '• Valide a identidade do usuário presencialmente',
    '• Reative a conta através do painel administrativo',
    '',
    'Esta é uma notificação automática enviada a todos os administradores ativos.'
  ]

  const infoText = [
    '<strong>ℹ️ Informações Adicionais</strong>',
    'Este procedimento faz parte das medidas de segurança do sistema.',
    'A desativação automática da conta após recuperação de senha protege contra acessos não autorizados.',
    '',
    'Por favor, não responda a este email.',
    'Em caso de dúvidas, entre em contato com o suporte técnico.'
  ]

  return EmailTemplateBuilder.build({
    recipientName: adminName,
    contentBeforeButton,
    contentAfterButton: [],
    infoText
  })
}
