import { EmailTemplateBuilder } from '../../utils-module/email-sender/email-template.builder'

/**
 * Template de email para código de recuperação de senha
 *
 * @param userName - Nome do usuário
 * @param code - Código de 6 dígitos
 * @returns HTML do email formatado
 */
export function getPasswordResetCodeEmailTemplate(
  userName: string,
  code: string
): string {
  const contentBeforeButton = [
    'Recebemos uma solicitação de recuperação de senha para sua conta.',
    'Para continuar com a redefinição de senha, utilize o código de verificação abaixo:',
    `<div style="margin: 30px 0; padding: 30px; background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); border-radius: 8px; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #fef3c7; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
        Código de Recuperação
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
    '• <strong>Sua conta será desativada</strong> após a redefinição de senha por segurança',
    '• Será necessário contatar um administrador para reativar sua conta',
    '• Se você não solicitou esta recuperação, ignore este email e sua conta permanecerá segura',
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
