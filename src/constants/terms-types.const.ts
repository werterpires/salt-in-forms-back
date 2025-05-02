export enum ETermsTypes {
  CODE_OF_CONDUCT = 1,
  DATA_PROCESSING_CONSENT = 2,
  DATA_RETENTION_POLICY = 3,
  EMPLOYEE_DATA_POLICY = 4,
  INFORMATION_SECURITY_POLICY = 5,
  PRIVACY_POLICY = 6,
  RISK_ACCEPTANCE_POLICY = 7,
  SERVICE_TERMS = 8,
  TERMS_OF_USE = 9,
  ACCEPTABLE_USE_POLICY = 10,
  COOKIES_POLICY = 11
}

export const TermsTypesDetails: Record<ETermsTypes, { typeName: string }> = {
  [ETermsTypes.CODE_OF_CONDUCT]: {
    typeName: 'Código de Conduta'
  },
  [ETermsTypes.DATA_PROCESSING_CONSENT]: {
    typeName: 'Consentimento de Processamento de Dados'
  },
  [ETermsTypes.DATA_RETENTION_POLICY]: {
    typeName: 'Política de Retenção de Dados'
  },
  [ETermsTypes.EMPLOYEE_DATA_POLICY]: {
    typeName: 'Política de Dados de Funcionários'
  },
  [ETermsTypes.INFORMATION_SECURITY_POLICY]: {
    typeName: 'Política de Segurança da Informação'
  },
  [ETermsTypes.PRIVACY_POLICY]: {
    typeName: 'Política de Privacidade'
  },
  [ETermsTypes.RISK_ACCEPTANCE_POLICY]: {
    typeName: 'Política de Aceitação de Riscos'
  },
  [ETermsTypes.SERVICE_TERMS]: {
    typeName: 'Termos de Serviço'
  },
  [ETermsTypes.TERMS_OF_USE]: {
    typeName: 'Termos de Uso'
  },
  [ETermsTypes.ACCEPTABLE_USE_POLICY]: {
    typeName: 'Política de Uso Aceitável'
  },
  [ETermsTypes.COOKIES_POLICY]: {
    typeName: 'Política de Cookies'
  }
}
