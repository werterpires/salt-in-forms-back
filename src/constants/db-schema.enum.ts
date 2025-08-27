export enum Tables {
  USERS = 'users',
  USERS_ROLES = 'usersRoles',
  TERMS = 'terms',
  TERMS_SIGNATURES = 'termsSignatures',
  PROCESSES = 'processes',
  S_FORMS = 'sForms',
  QUESTIONS_AREAS = 'questionsAreas',
  MINISTERIALS = 'ministerials',
  FORM_SECTIONS = 'formSections',
  QUESTIONS = 'questions',
  QUESTION_OPTIONS = 'questionOptions',
  VALIDATIONS = 'validations',
  SUB_QUESTIONS = 'subQuestions',
  SUB_QUESTION_OPTIONS = 'subQuestionOptions',
  SUB_VALIDATIONS = 'subValidations'
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
  PROCESS_ID = 'processId',
  S_FORM_NAME = 'sFormName',
  S_FORM_TYPE = 'sFormType'
}

export enum QuestionsAreas {
  QUESTION_AREA_ID = 'questionAreaId',
  QUESTION_AREA_NAME = 'questionAreaName',
  QUESTION_AREA_DESCRIPTION = 'questionAreaDescription',
  QUESTION_AREA_ACTIVE = 'questionAreaActive'
}

export enum Ministerials {
  MINISTERIAL_ID = 'ministerialId',
  MINISTERIAL_NAME = 'ministerialName',
  MINISTERIAL_FIELD = 'ministerialField',
  MINISTERIAL_EMAIL = 'ministerialEmail',
  MINISTERIAL_ACTIVE = 'ministerialActive'
}

export enum FormSections {
  FORM_SECTION_ID = 'formSectionId',
  S_FORM_ID = 'sFormId',
  FORM_SECTION_NAME = 'formSectionName',
  FORM_SECTION_ORDER = 'formSectionOrder',
  FORM_SECTION_DISPLAY_RULE = 'formSectionDisplayRule',
  FORM_SECTION_DISPLAY_LINK = 'formSectionDisplayLink',
  QUESTION_DISPLAY_LINK = 'questionDisplayLink',
  ANSWER_DISPLEY_RULE = 'answerDisplayRule',
  ANSWER_DISPLAY_VALUE = 'answerDisplayValue'
}

export enum Questions {
  QUESTION_ID = 'questionId',
  FORM_SECTION_ID = 'formSectionId',
  QUESTION_AREA_ID = 'questionAreaId',
  QUESTION_ORDER = 'questionOrder',
  QUESTION_TYPE = 'questionType',
  QUESTION_STATEMENT = 'questionStatement',
  QUESTION_DESCRIPTION = 'questionDescription',
  QUESTION_DISPLAY_RULE = 'questionDisplayRule',
  FORM_SECTION_DISPLAY_LINK = 'formSectionDisplayLink',
  QUESTION_DISPLAY_LINK = 'questionDisplayLink',
  ANSWER_DISPLEY_RULE = 'answerDisplayRule',
  ANSWER_DISPLAY_VALUE = 'answerDisplayValue'
}

export enum QuestionOptions {
  QUESTION_OPTION_ID = 'questionOptionId',
  QUESTION_ID = 'questionId',
  QUESTION_OPTION_TYPE = 'questionOptionType',
  QUESTION_OPTION_VALUE = 'questionOptionValue'
}

export enum Validations {
  VALIDATION_ID = 'validationId',
  VALIDATION_TYPE = 'validationType',
  QUESTION_ID = 'questionId',
  VALUE_ONE = 'valueOne',
  VALUE_TWO = 'valueTwo',
  VALUE_THREE = 'valueThree',
  VALUE_FOUR = 'valueFour'
}

export enum SubQuestions {
  SUB_QUESTION_ID = 'subQuestionId',
  QUESTION_ID = 'questionId',
  SUB_QUESTION_POSITION = 'subQuestionPosition',
  SUB_QUESTION_STATEMENT = 'subQuestionStatement',
  SUB_QUESTION_TYPE = 'subQuestionType'
}

export enum SubQuestionOptions {
  SUB_QUESTION_OPTION_ID = 'subQuestionOptionId',
  SUB_QUESTION_ID = 'subQuestionId',
  SUB_QUESTION_OPTION_TYPE = 'subQuestionOptionType',
  SUB_QUESTION_OPTION_VALUE = 'subQuestionOptionValue'
}

export enum SubValidations {
  SUB_VALIDATION_ID = 'subValidationId',
  SUB_VALIDATION_TYPE = 'subValidationType',
  SUB_QUESTION_ID = 'subQuestionId',
  SUB_VALUE_ONE = 'subValueOne',
  SUB_VALUE_TWO = 'subValueTwo',
  SUB_VALUE_THREE = 'subValueThree',
  SUB_VALUE_FOUR = 'subValueFour'
}
