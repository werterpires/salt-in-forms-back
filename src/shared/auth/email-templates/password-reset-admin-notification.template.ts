import {
  AlertBox,
  EmailTemplateBuilder,
  KeyValueBox
} from '../../utils-module/email-sender/email-template.builder'

export function getPasswordResetAdminNotificationEmailTemplate(
  adminName: string,
  userEmail: string,
  timestamp: string
): string {
  const keyValueBox: KeyValueBox = {
    type: 'keyValueBox',
    backgroundColor: '#f3f4f6',
    fields: [
      { label: 'Usuário', value: userEmail },
      { label: 'Ação', value: 'Redefinição de senha via recuperação' },
      { label: 'Data/Hora', value: timestamp }
    ]
  }

  const alertBox: AlertBox = {
    type: 'alertBox',
    title: 'Conta Desativada',
    message:
      'A conta deste usuário foi <strong>desativada automaticamente</strong> por segurança.',
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    titleColor: '#92400e',
    textColor: '#78350f'
  }

  const contentBeforeButton = [
    '<strong>Notificação de Segurança</strong>',
    'Um usuário realizou recuperação de senha através do sistema.',
    keyValueBox,
    alertBox,
    '<strong>Próximos Passos:</strong>',
    '• O usuário deverá solicitar reativação da conta',
    '• Valide a identidade do usuário presencialmente',
    '• Reative a conta através do painel administrativo',
    'Esta é uma notificação automática enviada a todos os administradores ativos.'
  ]

  const infoText = [
    '<strong>ℹ️ Informações Adicionais</strong>',
    'Este procedimento faz parte das medidas de segurança do sistema.',
    'A desativação automática da conta após recuperação de senha protege contra acessos não autorizados.',
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
