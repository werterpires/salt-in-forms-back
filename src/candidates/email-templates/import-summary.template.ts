import { EmailTemplateBuilder } from 'src/shared/utils-module/email-sender/email-template.builder'
import { StatCards } from 'src/shared/utils-module/email-sender/email-template.builder'

export function getImportSummaryEmailTemplate(
  totalFound: number,
  totalDuplicated: number,
  totalInserted: number
): string {
  const summary = `De ${totalFound} candidatos encontrados, ${totalDuplicated} ${totalDuplicated === 1 ? 'foi descartado' : 'foram descartados'} por duplicidade e ${totalInserted} ${totalInserted === 1 ? 'foi inserido' : 'foram inseridos'} no sistema.`

  const statCards: StatCards = {
    type: 'statCards',
    cards: [
      {
        label: 'Total Encontrado',
        value: totalFound,
        backgroundColor: '#f0f9ff',
        borderColor: '#3b82f6',
        valueColor: '#1e40af'
      },
      {
        label: 'Duplicados (Descartados)',
        value: totalDuplicated,
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
        valueColor: '#d97706'
      },
      {
        label: 'Inseridos com Sucesso',
        value: totalInserted,
        backgroundColor: '#d1fae5',
        borderColor: '#10b981',
        valueColor: '#059669'
      }
    ]
  }

  const contentBeforeButton = [
    'O processo de importação de candidatos foi concluído. Aqui está o resumo:',
    statCards,
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
