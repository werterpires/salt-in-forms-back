import {
  AlertBox,
  EmailTemplateBuilder
} from '../../utils-module/email-sender/email-template.builder'

export function getPasswordResetSuccessEmailTemplate(
  userName: string,
  timestamp: string
): string {
  const alertBox: AlertBox = {
    type: 'alertBox',
    icon: '🔒',
    title: 'Conta Desativada por Segurança',
    message:
      'Por medida de segurança, sua conta foi <strong>desativada automaticamente</strong>.',
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    titleColor: '#92400e',
    textColor: '#78350f'
  }

  const contentBeforeButton = [
    'Sua senha foi <strong>redefinida com sucesso</strong>.',
    alertBox,
    '<strong>Próximos Passos:</strong>',
    '• Entre em contato com um <strong>administrador do sistema</strong>',
    '• Solicite a <strong>reativação da sua conta</strong>',
    '• Será necessário validar sua identidade presencialmente',
    `<span style="font-size:12px;color:#6b7280;">Data e hora da alteração: <strong>${timestamp}</strong></span>`
  ]

  const infoText = [
    '<strong>⚠️ Não Reconhece Esta Ação?</strong>',
    'Se você <strong>não realizou</strong> esta alteração de senha, entre em contato <strong>imediatamente</strong> com um administrador.',
    'Sua conta já está desativada, portanto ninguém pode acessá-la até que seja reativada por um administrador.',
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
