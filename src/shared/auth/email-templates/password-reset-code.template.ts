import {
  CodeBlock,
  EmailTemplateBuilder
} from '../../utils-module/email-sender/email-template.builder'

export function getPasswordResetCodeEmailTemplate(
  userName: string,
  code: string
): string {
  const codeBlock: CodeBlock = {
    type: 'codeBlock',
    label: 'Código de Recuperação',
    code,
    backgroundColor: '#b45309',
    textColor: '#ffffff',
    labelColor: '#fef3c7'
  }

  const contentBeforeButton = [
    'Recebemos uma solicitação de recuperação de senha para sua conta.',
    'Para continuar com a redefinição de senha, utilize o código de verificação abaixo:',
    codeBlock
  ]

  const infoText = [
    '<strong>⚠️ Informações Importantes:</strong>',
    '• Este código é válido por <strong>30 minutos</strong>',
    '• Você tem no máximo <strong>5 tentativas</strong> de validação',
    '• Não compartilhe este código com ninguém',
    '• <strong>Sua conta será desativada</strong> após a redefinição de senha por segurança',
    '• Será necessário contatar um administrador para reativar sua conta',
    '• Se você não solicitou esta recuperação, ignore este email e sua conta permanecerá segura',
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
