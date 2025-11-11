import { EmailTemplateBuilder } from 'src/shared/utils-module/email-sender/email-template.builder'

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
  const summary = `De ${totalFound} candidatos encontrados, ${totalDuplicated} ${totalDuplicated === 1 ? 'foi descartado' : 'foram descartados'} por duplicidade e ${totalInserted} ${totalInserted === 1 ? 'foi inserido' : 'foram inseridos'} no sistema.`

  const contentBeforeButton = [
    'O processo de importação de candidatos foi concluído. Aqui está o resumo:',
    `
      <div style="margin: 20px 0;">
        <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 6px; margin-bottom: 12px;">
          <p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px; font-weight: 500;">Total Encontrado</p>
          <p style="margin: 0; color: #1e40af; font-size: 28px; font-weight: 700;">${totalFound}</p>
        </div>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin-bottom: 12px;">
          <p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px; font-weight: 500;">Duplicados (Descartados)</p>
          <p style="margin: 0; color: #d97706; font-size: 28px; font-weight: 700;">${totalDuplicated}</p>
        </div>
        
        <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px;">
          <p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px; font-weight: 500;">Inseridos com Sucesso</p>
          <p style="margin: 0; color: #059669; font-size: 28px; font-weight: 700;">${totalInserted}</p>
        </div>
      </div>
    `,
    `<strong>Resumo:</strong> ${summary}`
  ]

  return EmailTemplateBuilder.build(
    {
      recipientName: 'Administrador',
      contentBeforeButton
    },
    undefined,
    {
      menuItems: ['Sistema de Importação', 'FAAMA', 'Suporte']
    }
  )
}
