import { EmailTemplateBuilder } from '../../utils-module/email-sender/email-template.builder'

/**
 * Template de email para código de autenticação de 2 fatores
 *
 * @param userName - Nome do usuário
 * @param code - Código de 6 dígitos
 * @returns HTML do email formatado
 */
export function getTwoFactorCodeEmailTemplate(
  userName: string,
  code: string
): string {
  const contentBeforeButton = [
    'Recebemos uma solicitação de login na sua conta.',
    'Para continuar, utilize o código de verificação abaixo:',
    `<div style="margin: 30px 0; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #e0e7ff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
        Seu Código de Verificação
      </p>
      <p style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 8px;">
        ${code}
      </p>
    </div>`
  ]

  const infoText = [
    '<strong>⚠️ Informações Importantes:</strong>',
    '• Este código é válido por <strong>30 minutos</strong>',
    '• Você tem no máximo <strong>5 tentativas</strong> de validação',
    '• Não compartilhe este código com ninguém',
    '• Se você não solicitou este login, ignore este email',
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
