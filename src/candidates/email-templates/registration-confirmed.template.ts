import { EmailTemplateBuilder } from 'src/shared/utils-module/email-sender/email-template.builder'

/**
 * Template de email de cadastro confirmado com sucesso
 *
 * @param candidateName - Nome do candidato
 * @returns HTML do email formatado
 */
export function getRegistrationConfirmedTemplate(
  candidateName: string
): string {
  const contentBeforeButton = [
    '🎉 Seu cadastro foi confirmado com sucesso!',
    'Seu email foi verificado e seu cadastro no processo seletivo do FAAMA está completo.',
    'Em até 30 minutos você receberá um email com o link para acessar o formulário de inscrição.',
    'Fique atento à sua caixa de entrada e também à pasta de spam.'
  ]

  const contentAfterButton = [
    '<strong>Próximos passos:</strong>',
    '1. Aguarde o email com o link de acesso ao formulário',
    '2. Preencha o formulário dentro do prazo estabelecido no edital do vestibular.',
    '3. Acompanhe as etapas do processo seletivo'
  ]

  return EmailTemplateBuilder.build({
    recipientName: candidateName,
    contentBeforeButton,
    contentAfterButton
  })
}
