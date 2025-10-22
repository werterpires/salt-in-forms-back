/**
 * Template de email para resumo de importação de candidatos
 *
 * @param totalFound - Total de candidatos encontrados
 * @param totalDuplicated - Total de candidatos duplicados
 * @param totalInserted - Total de candidatos inseridos
 * @returns HTML do email formatado
 */
export function getImportSummaryEmailTemplate(
  totalFound: number,
  totalDuplicated: number,
  totalInserted: number
): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório de Importação de Candidatos</title>
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
                    📊 Relatório de Importação
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                    Processamento de Candidatos
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                    Olá! O processo de importação de candidatos foi concluído. Aqui está o resumo:
                  </p>
                  
                  <!-- Statistics Cards -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom: 20px;">
                        <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px;">
                          <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px; font-weight: 500;">
                            Total Encontrado
                          </p>
                          <p style="margin: 0; color: #1e40af; font-size: 32px; font-weight: 700;">
                            ${totalFound}
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding-bottom: 20px;">
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 6px;">
                          <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px; font-weight: 500;">
                            Duplicados (Descartados)
                          </p>
                          <p style="margin: 0; color: #d97706; font-size: 32px; font-weight: 700;">
                            ${totalDuplicated}
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <tr>
                      <td>
                        <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; border-radius: 6px;">
                          <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px; font-weight: 500;">
                            Inseridos com Sucesso
                          </p>
                          <p style="margin: 0; color: #059669; font-size: 32px; font-weight: 700;">
                            ${totalInserted}
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Summary -->
                  <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
                    <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                      <strong>Resumo:</strong> De ${totalFound} candidatos encontrados, ${totalDuplicated} ${totalDuplicated === 1 ? 'foi descartado' : 'foram descartados'} por duplicidade e ${totalInserted} ${totalInserted === 1 ? 'foi inserido' : 'foram inseridos'} no sistema.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #94a3b8; font-size: 14px;">
                    Este é um email automático do sistema de importação de candidatos
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
