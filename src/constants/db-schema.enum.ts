export enum Tables {
  USERS = 'users',
  USERS_ROLES = 'usersRoles',
  TERMS = 'terms',
  TERMS_SIGNATURES = 'termsSignatures'
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
  USER_ID = 'userId'
}
