import {
  AlertBox,
  EmailTemplateBuilder
} from '../../utils-module/email-sender/email-template.builder'

export function getPasswordChangedEmailTemplate(
  userName: string,
  timestamp: string
): string {
  const alertBox: AlertBox = {
    type: 'alertBox',
    icon: '✓',
    title: 'Alteração Confirmada',
    message:
      'Esta alteração foi realizada com você <strong>autenticado</strong> no sistema.',
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    titleColor: '#065f46',
    textColor: '#047857'
  }

  const contentBeforeButton = [
    'Sua senha foi <strong>alterada com sucesso</strong>.',
    alertBox,
    `<span style="font-size:12px;color:#6b7280;">Data e hora da alteração: <strong>${timestamp}</strong></span>`
  ]

  const infoText = [
    '<strong>⚠️ Não Reconhece Esta Ação?</strong>',
    'Se você <strong>não realizou</strong> esta alteração de senha, sua conta pode estar comprometida.',
    'Ações recomendadas:',
    '• Entre em contato <strong>imediatamente</strong> com um administrador',
    '• Solicite o bloqueio temporário da sua conta',
    '• Verifique se há atividades suspeitas recentes',
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
