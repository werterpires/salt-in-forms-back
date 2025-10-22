/**
 * Template de email para acesso ao formulário do tipo "candidate"
 *
 * @param candidateName - Nome do candidato
 * @param accessLink - Link de acesso ao formulário
 * @param accessCode - Código de acesso
 * @returns HTML do email formatado
 */
export function getCandidateFormAccessEmailTemplate(
  candidateName: string,
  accessLink: string,
  accessCode: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Acesso ao Formulário de Inscrição</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                    📝 Formulário de Inscrição
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                    Vestibular FAAMA
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                    Olá, <strong>${candidateName}</strong>!
                  </p>
                  
                  <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                    Você está recebendo este e-mail para acessar o formulário de inscrição do vestibular do FAAMA. 
                    Por favor, clique no botão abaixo para preencher seu formulário.
                  </p>
                  
                  <!-- Access Button -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${accessLink}" style="display: inline-block; padding: 16px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Acessar Formulário
                    </a>
                  </div>
                  
                  <!-- Access Code Info -->
                  <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #667eea;">
                    <p style="margin: 0 0 10px 0; color: #475569; font-size: 14px;">
                      <strong>Código de Acesso:</strong>
                    </p>
                    <p style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 600; font-family: monospace;">
                      ${accessCode}
                    </p>
                  </div>
                  
                  <p style="margin: 30px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                    <strong>Importante:</strong> Este código de acesso é válido por 24 horas. 
                    Caso expire, um novo código será gerado automaticamente.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #94a3b8; font-size: 14px;">
                    Este é um email automático do sistema de inscrições FAAMA
                  </p>
                  <p style="margin: 10px 0 0 0; color: #cbd5e1; font-size: 12px;">
                    Data: ${new Date().toLocaleString('pt-BR')}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
