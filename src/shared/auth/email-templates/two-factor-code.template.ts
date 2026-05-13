import {
  CodeBlock,
  EmailTemplateBuilder
} from '../../utils-module/email-sender/email-template.builder'

export function getTwoFactorCodeEmailTemplate(
  userName: string,
  code: string
): string {
  const codeBlock: CodeBlock = {
    type: 'codeBlock',
    label: 'Seu Código de Verificação',
    code,
    backgroundColor: '#5b21b6',
    textColor: '#ffffff',
    labelColor: '#e0e7ff'
  }

  const contentBeforeButton = [
    'Recebemos uma solicitação de login na sua conta.',
    'Para continuar, utilize o código de verificação abaixo:',
    codeBlock
  ]

  const infoText = [
    '<strong>⚠️ Informações Importantes:</strong>',
    '• Este código é válido por <strong>30 minutos</strong>',
    '• Você tem no máximo <strong>5 tentativas</strong> de validação',
    '• Não compartilhe este código com ninguém',
    '• Se você não solicitou este login, ignore este email',
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
