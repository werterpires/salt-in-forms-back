export enum Tables {
  USERS = 'users',
  USERS_ROLES = 'usersRoles',
  TERMS = 'terms',
  TERMS_SIGNATURES = 'termsSignatures',
  PROCESSES = 'processes',
  S_FORMS = 'sForms'
}

export enum Users {
  USER_ID = 'userId',
  USER_NAME = 'userName',
  USER_CPF = 'userCpf',
  USER_EMAIL = 'userEmail',
  USER_PASSWORD = 'userPassword',
  USER_PASSWORD_RECOVER_CODE = 'userPasswordRecoverCode',
  USER_ACTIVE = 'userActive',
  USER_INVITE_CODE = 'userInviteCode'
}

export enum UsersRoles {
  USER_ID = 'userId',
  ROLE_ID = 'roleId',
  USER_ROLE_ACTIVE = 'userRoleActive'
}

export enum Terms {
  TERM_ID = 'termId',
  ROLE_ID = 'roleId',
  TERM_TYPE_ID = 'termTypeId',
  TERM_TEXT = 'termText',
  BEGIN_DATE = 'beginDate',
  END_DATE = 'endDate'
}

export enum TermsSignatures {
  TERM_SIGNATURE_ID = 'termSignatureId',
  TERM_ID = 'termId',
  USER_ID = 'userId',
  TERM_UNSIGNED_TIME = 'termUnsigned'
}

export enum Processes {
  PROCESS_ID = 'processId',
  PROCESS_TITLE = 'processTitle',
  PROCESS_TOTVS_ID = 'processTotvsId',
  PROCESS_BEGIN_DATE = 'processBeginDate',
  PROCESS_END_DATE = 'processEndDate'
}

export enum SForms {
  S_FORM_ID = 'sFormId',
  PROCESS_ID = 'sProcessId',
  S_FORM_NAME = 'sFormName',
  S_FORM_TYPE = 'sFormType'
}
