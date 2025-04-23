export enum ETermsTypes {
  PRIVACY_POLICY = 1,
  TERMS_OF_USE = 2,
  COOKIES_POLICY = 3,
  DATA_CONSENT = 4,
  INFO_SECURITY_POLICY = 5,
  EMPLOYEE_PRIVACY_NOTICE = 6
}

export const TermsTypesDetails: Record<ETermsTypes, { typeName: string }> = {
  [ETermsTypes.PRIVACY_POLICY]: { typeName: 'Política de Privacidade' },
  [ETermsTypes.TERMS_OF_USE]: { typeName: 'Termos de Uso' },
  [ETermsTypes.COOKIES_POLICY]: { typeName: 'Política de Cookies' },
  [ETermsTypes.DATA_CONSENT]: {
    typeName: 'Consentimento de Tratamento de Dados'
  },
  [ETermsTypes.INFO_SECURITY_POLICY]: {
    typeName: 'Política de Segurança da Informação'
  },
  [ETermsTypes.EMPLOYEE_PRIVACY_NOTICE]: {
    typeName: 'Aviso de Privacidade para Funcionários'
  }
}
