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
  QUESTION_SCORES = 'questionScores',
  VALIDATIONS = 'validations',
  SUB_QUESTIONS = 'subQuestions',
  SUB_QUESTION_OPTIONS = 'subQuestionOptions',
  SUB_VALIDATIONS = 'subValidations',
  CANDIDATES = 'candidates',
  PENDING_CANDIDATES = 'pendingCandidates',
  FORMS_CANDIDATES = 'formsCandidates',
  ANSWERS = 'answers',
  UNIONS = 'unions',
  FIELDS = 'fields',
  CANDIDATES_TERMS_SIGNATURES = 'candidatesTermsSignatures',
  RATES = 'rates'
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
  PROCESS_DATA_KEY = 'processDataKey',
  PROCESS_BEGIN_DATE = 'processBeginDate',
  PROCESS_END_DATE = 'processEndDate',
  PROCESS_END_ANSWERS = 'processEndAnswers',
  PROCESS_END_SUBSCRIPTION = 'processEndSubscription',
  CUTOFF_SCORE = 'cutoffScore'
}

export enum SForms {
  S_FORM_ID = 'sFormId',
  PROCESS_ID = 'processId',
  S_FORM_NAME = 'sFormName',
  S_FORM_TYPE = 'sFormType',
  EMAIL_QUESTION_ID = 'emailQuestionId'
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
  MINISTERIAL_PRIMARY_PHONE = 'ministerialPrimaryPhone',
  MINISTERIAL_SECONDARY_PHONE = 'ministerialSecondaryPhone',
  MINISTERIAL_LANDLINE_PHONE = 'ministerialLandlinePhone',
  MINISTERIAL_PRIMARY_EMAIL = 'ministerialPrimaryEmail',
  MINISTERIAL_ALTERNATIVE_EMAIL = 'ministerialAlternativeEmail',
  MINISTERIAL_SECRETARY_NAME = 'ministerialSecretaryName',
  MINISTERIAL_SECRETARY_PHONE = 'ministerialSecretaryPhone',
  MINISTERIAL_ACTIVE = 'ministerialActive',
  FIELD_ID = 'fieldId'
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
  QUESTION_OPTION_ID = 'questionOptionId',
  QUESTION_ID = 'questionId',
  QUESTION_OPTION_TYPE = 'questionOptionType',
  QUESTION_OPTION_VALUE = 'questionOptionValue'
}

export enum SubValidations {
  VALIDATION_ID = 'validationId',
  VALIDATION_TYPE = 'validationType',
  QUESTION_ID = 'questionId',
  VALUE_ONE = 'valueOne',
  VALUE_TWO = 'valueTwo',
  VALUE_THREE = 'valueThree',
  VALUE_FOUR = 'valueFour'
}

export enum Candidates {
  CANDIDATE_ID = 'candidateId',
  PROCESS_ID = 'processId',
  CANDIDATE_NAME = 'candidateName',
  CANDIDATE_UNIQUE_DOCUMENT = 'candidateUniqueDocument',
  CANDIDATE_EMAIL = 'candidateEmail',
  CANDIDATE_DOCUMENT_TYPE = 'candidateDocumentType',
  CANDIDATE_PHONE = 'candidatePhone',
  CANDIDATE_BIRTHDATE = 'candidateBirthdate',
  CANDIDATE_FOREIGNER = 'candidateForeigner',
  CANDIDATE_ADDRESS = 'candidateAddress',
  CANDIDATE_ADDRESS_NUMBER = 'candidateAddressNumber',
  CANDIDATE_DISTRICT = 'candidateDistrict',
  CANDIDATE_CITY = 'candidateCity',
  CANDIDATE_STATE = 'candidateState',
  CANDIDATE_ZIP_CODE = 'candidateZipCode',
  CANDIDATE_COUNTRY = 'candidateCountry',
  CANDIDATE_MARITAL_STATUS = 'candidateMaritalStatus',
  INTERVIEW_USER_ID = 'interviewUserId',
  CANDIDATE_ORDER_CODE = 'candidateOrderCode',
  CANDIDATE_ORDER_CODE_VALIDATED_AT = 'candidateOrderCodeValidatedAt',
  APPROVED = 'approved'
}

export enum FormsCandidates {
  FORM_CANDIDATE_ID = 'formCandidateId',
  CANDIDATE_ID = 'candidateId',
  S_FORM_ID = 'sFormId',
  FORM_CANDIDATE_STATUS = 'formCandidateStatus',
  FORM_CANDIDATE_ACCESS_CODE = 'formCandidateAccessCode'
}

export enum Answers {
  ANSWER_ID = 'answerId',
  QUESTION_ID = 'questionId',
  FORM_CANDIDATE_ID = 'formCandidateId',
  ANSWER_VALUE = 'answerValue',
  VALID_ANSWER = 'validAnswer',
  ANSWER_COMMENT = 'answerComment'
}

export enum Unions {
  UNION_ID = 'unionId',
  UNION_NAME = 'unionName',
  UNION_ACRONYM = 'unionAcronym'
}

export enum Fields {
  FIELD_ID = 'fieldId',
  FIELD_NAME = 'fieldName',
  FIELD_ACRONYM = 'fieldAcronym',
  UNION_ID = 'unionId'
}

export enum PendingCandidates {
  PENDING_CANDIDATE_ID = 'pendingCandidateId',
  CANDIDATE_NAME = 'candidateName',
  CANDIDATE_EMAIL = 'candidateEmail',
  CANDIDATE_DOCUMENT_TYPE = 'candidateDocumentType',
  CANDIDATE_UNIQUE_DOCUMENT = 'candidateUniqueDocument',
  CANDIDATE_PHONE = 'candidatePhone',
  ORDER_CODE = 'orderCode',
  PROCESS_ID = 'processId',
  CONFIRMATION_TOKEN = 'confirmationToken',
  TOKEN_EXPIRES_AT = 'tokenExpiresAt',
  ATTEMPT_COUNT = 'attemptCount',
  CREATED_AT = 'createdAt',
  CONFIRMED_AT = 'confirmedAt',
  INVALIDATED_AT = 'invalidatedAt'
}

export enum CandidatesTermsSignatures {
  CANDIDATE_TERM_SIGNATURE_ID = 'candidateTermSignatureId',
  FORM_CANDIDATE_ID = 'formCandidateId',
  TERM_ID = 'termId',
  TERM_UNSIGNED = 'termUnsigned'
}

export enum Rates {
  RATE_ID = 'rateId',
  CANDIDATE_ID = 'candidateId',
  INTERVIEWER_ID = 'interviewerId',
  RATE_VALUE = 'rateValue',
  RATE_COMMENT = 'rateComment',
  QUESTION_AREA_ID = 'questionAreaId'
}

export enum QuestionScores {
  QUESTION_SCORE_ID = 'questionScoreId',
  QUESTION_ID = 'questionId',
  SCORE_TYPE = 'scoreType',
  OPTION_SCORES_JSON = 'optionScoresJson',
  DATE_COMPARISON_TYPE = 'dateComparisonType',
  CUTOFF_DATE = 'cutoffDate',
  DATE_SCORE = 'dateScore'
}
