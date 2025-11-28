export enum CustomErrors {
  UNAUTHORIZED_EXCEPTION = '#Email e/ou senha não encontrado(s) ou não se correspondem',
  INACTIVE_USER = '#Usuário inativado pelo administrador do sistema.',
  USER_NOT_FOUND_BY_INVITATION_CODE = '#Código de convite não encontrado.',
  INVITE_CODE_EXPIRED = '#Convite expirado.',
  TERMS_NOT_SIGNED = '#Todos os termos de uso devem ser aceitos.',
  TWO_FACTOR_REQUIRED = '#Autenticação de dois fatores necessária. Verifique seu email.',
  INVALID_2FA_CODE = '#Código de verificação inválido ou expirado.',
  NO_2FA_CODE_PENDING = '#Nenhum código de verificação pendente para este email.'
}
