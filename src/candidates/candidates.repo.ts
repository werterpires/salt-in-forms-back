import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import * as db from '../constants/db-schema.enum'
import { Process } from 'src/processes/types'
import {
  CreateCandidate,
  CreateFormCandidate,
  FormCandidate,
  InsertCompleteCandidate
} from './types'
import { ERoles } from '../constants/roles.const'
import { Term } from 'src/terms/types'
import { Answer } from 'src/answers/types'
import { Paginator } from '../shared/types/types'

@Injectable()
export class CandidatesRepo {
  elementsPerPage = 20

  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async findProcessInSubscription(): Promise<Process[]> {
    const today = new Date()
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(today.getDate() - 3)

    return this.knex(db.Tables.PROCESSES)
      .select(
        db.Processes.PROCESS_ID,
        db.Processes.PROCESS_TITLE,
        db.Processes.PROCESS_DATA_KEY,
        db.Processes.PROCESS_BEGIN_DATE,
        db.Processes.PROCESS_END_DATE,
        db.Processes.PROCESS_END_ANSWERS,
        db.Processes.PROCESS_END_SUBSCRIPTION
      )
      .where(db.Processes.PROCESS_BEGIN_DATE, '<=', today)
      .where(db.Processes.PROCESS_END_SUBSCRIPTION, '>=', threeDaysAgo)
      .orderBy(db.Processes.PROCESS_TITLE, 'asc')
  }

  async findProcessesInAnswerPeriod(): Promise<Process[]> {
    const today = new Date()

    return this.knex(db.Tables.PROCESSES)
      .select(
        db.Processes.PROCESS_ID,
        db.Processes.PROCESS_TITLE,
        db.Processes.PROCESS_DATA_KEY,
        db.Processes.PROCESS_BEGIN_DATE,
        db.Processes.PROCESS_END_DATE,
        db.Processes.PROCESS_END_ANSWERS,
        db.Processes.PROCESS_END_SUBSCRIPTION
      )
      .where(db.Processes.PROCESS_BEGIN_DATE, '<=', today)
      .where(db.Processes.PROCESS_END_ANSWERS, '>=', today)
      .orderBy(db.Processes.PROCESS_TITLE, 'asc')
  }

  async findSFormsByProcessId(processId: number) {
    return this.knex(db.Tables.S_FORMS)
      .select(
        db.SForms.S_FORM_ID,
        db.SForms.S_FORM_NAME,
        db.SForms.S_FORM_TYPE,
        db.SForms.PROCESS_ID
      )
      .where(db.SForms.PROCESS_ID, processId)
      .orderBy(db.SForms.S_FORM_NAME, 'asc')
  }

  async findExistingCandidatesByProcessAndDocument(
    processId: number,
    uniqueDocuments: string[]
  ): Promise<string[]> {
    const existingCandidates = await this.knex(db.Tables.CANDIDATES)
      .select(db.Candidates.CANDIDATE_UNIQUE_DOCUMENT)
      .where(db.Candidates.PROCESS_ID, processId)
      .whereIn(db.Candidates.CANDIDATE_UNIQUE_DOCUMENT, uniqueDocuments)

    return existingCandidates.map(
      (candidate) => candidate[db.Candidates.CANDIDATE_UNIQUE_DOCUMENT]
    )
  }

  async insertCandidatesInBatch(candidates: CreateCandidate[]): Promise<void> {
    if (candidates.length === 0) {
      return
    }

    await this.knex.transaction(async (trx) => {
      const candidatesToInsert = candidates.map((candidate) => ({
        [db.Candidates.PROCESS_ID]: candidate.processId,
        [db.Candidates.CANDIDATE_NAME]: candidate.candidateName,
        [db.Candidates.CANDIDATE_UNIQUE_DOCUMENT]:
          candidate.candidateUniqueDocument,
        [db.Candidates.CANDIDATE_EMAIL]: candidate.candidateEmail,
        [db.Candidates.CANDIDATE_PHONE]: candidate.candidatePhone,
        [db.Candidates.CANDIDATE_BIRTHDATE]: candidate.candidateBirthdate,
        [db.Candidates.CANDIDATE_FOREIGNER]: candidate.candidateForeigner,
        [db.Candidates.CANDIDATE_ADDRESS]: candidate.candidateAddress,
        [db.Candidates.CANDIDATE_ADDRESS_NUMBER]:
          candidate.candidateAddressNumber,
        [db.Candidates.CANDIDATE_DISTRICT]: candidate.candidateDistrict,
        [db.Candidates.CANDIDATE_CITY]: candidate.candidateCity,
        [db.Candidates.CANDIDATE_STATE]: candidate.candidateState,
        [db.Candidates.CANDIDATE_ZIP_CODE]: candidate.candidateZipCode,
        [db.Candidates.CANDIDATE_COUNTRY]: candidate.candidateCountry
      }))

      await trx(db.Tables.CANDIDATES).insert(candidatesToInsert)
    })
  }

  /**
   * Busca candidatos que ainda não têm registro na tabela FormsCandidates
   *
   * @param processId - ID do processo
   * @returns Array de IDs dos candidatos sem FormsCandidates
   */
  async findCandidatesNotInFormsCandidatesByProcessId(
    processId: number
  ): Promise<number[]> {
    const candidatesInProcess = await this.knex(db.Tables.CANDIDATES)
      .select(db.Candidates.CANDIDATE_ID)
      .where(db.Candidates.PROCESS_ID, processId)

    const candidateIds: number[] = candidatesInProcess.map(
      (c) => c[db.Candidates.CANDIDATE_ID]
    )

    if (candidateIds.length === 0) {
      return []
    }

    const candidatesInFormsCandidates = await this.knex(
      db.Tables.FORMS_CANDIDATES
    )
      .select(db.FormsCandidates.CANDIDATE_ID)
      .whereIn(db.FormsCandidates.CANDIDATE_ID, candidateIds)

    const candidateIdsInFormsCandidates = candidatesInFormsCandidates.map(
      (c) => c[db.FormsCandidates.CANDIDATE_ID]
    )

    return candidateIds.filter(
      (id) => !candidateIdsInFormsCandidates.includes(id)
    )
  }

  /**
   * Busca candidatos completos com seus FormsCandidates para envio de emails
   * Otimizado para evitar N+1 queries
   *
   * @param formsCandidatesIds - Array de IDs dos FormsCandidates
   * @returns Array com dados completos para envio de email
   */
  async findCandidatesWithFormsCandidatesByIds(
    formsCandidatesIds: number[]
  ): Promise<any[]> {
    if (formsCandidatesIds.length === 0) {
      return []
    }

    return this.knex(db.Tables.FORMS_CANDIDATES)
      .select(
        `${db.Tables.FORMS_CANDIDATES}.*`,
        `${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_NAME} as candidateName`,
        `${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_EMAIL} as candidateEmail`,
        `${db.Tables.S_FORMS}.${db.SForms.S_FORM_TYPE} as sFormType`
      )
      .innerJoin(
        db.Tables.CANDIDATES,
        `${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_ID}`,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.CANDIDATE_ID}`
      )
      .innerJoin(
        db.Tables.S_FORMS,
        `${db.Tables.S_FORMS}.${db.SForms.S_FORM_ID}`,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.S_FORM_ID}`
      )
      .whereIn(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.FORM_CANDIDATE_ID}`,
        formsCandidatesIds
      )
  }

  async insertFormsCandidatesInBatch(
    formsCandidatesData: CreateFormCandidate[]
  ): Promise<number[]> {
    if (formsCandidatesData.length === 0) {
      return []
    }

    return this.knex.transaction(async (trx) => {
      const formsCandidatesToInsert = formsCandidatesData.map((fc) => ({
        [db.FormsCandidates.CANDIDATE_ID]: fc.candidateId,
        [db.FormsCandidates.S_FORM_ID]: fc.sFormId,
        [db.FormsCandidates.FORM_CANDIDATE_STATUS]: fc.formCandidateStatus,
        [db.FormsCandidates.FORM_CANDIDATE_ACCESS_CODE]:
          fc.formCandidateAccessCode
      }))

      const insertedIds = await trx(db.Tables.FORMS_CANDIDATES)
        .insert(formsCandidatesToInsert)
        .returning(db.FormsCandidates.FORM_CANDIDATE_ID)

      return insertedIds.map((row) =>
        typeof row === 'object'
          ? row[db.FormsCandidates.FORM_CANDIDATE_ID]
          : row
      )
    })
  }

  async findFormCandidateByAccessCode(
    accessCode: string
  ): Promise<FormCandidate | undefined> {
    const result = await this.knex(db.Tables.FORMS_CANDIDATES)
      .select('*')
      .where(db.FormsCandidates.FORM_CANDIDATE_ACCESS_CODE, accessCode)
      .first()

    return result
  }

  async updateAccessCode(
    formCandidateId: number,
    newAccessCode: string
  ): Promise<void> {
    await this.knex(db.Tables.FORMS_CANDIDATES)
      .where(db.FormsCandidates.FORM_CANDIDATE_ID, formCandidateId)
      .update({
        [db.FormsCandidates.FORM_CANDIDATE_ACCESS_CODE]: newAccessCode
      })
  }

  async findCandidateById(candidateId: number) {
    return this.knex(db.Tables.CANDIDATES)
      .select('*')
      .where(db.Candidates.CANDIDATE_ID, candidateId)
      .first()
  }

  /**
   * Busca informações básicas de todos os candidatos de um processo com paginação
   *
   * @param processId - ID do processo
   * @param orderBy - Objeto Paginator com informações de paginação e ordenação
   * @returns Array com informações básicas dos candidatos (dados criptografados)
   */
  async findCandidatesByProcessId(
    processId: number,
    orderBy: Paginator<typeof db.Candidates>
  ) {
    const query = this.knex(db.Tables.CANDIDATES)
      .select(
        db.Candidates.CANDIDATE_ID,
        db.Candidates.CANDIDATE_NAME,
        db.Candidates.CANDIDATE_UNIQUE_DOCUMENT,
        db.Candidates.CANDIDATE_DOCUMENT_TYPE,
        db.Candidates.CANDIDATE_EMAIL,
        db.Candidates.CANDIDATE_PHONE,
        db.Candidates.CANDIDATE_BIRTHDATE,
        db.Candidates.CANDIDATE_MARITAL_STATUS,
        db.Candidates.INTERVIEW_USER_ID,
        db.Candidates.APPROVED
      )
      .where(db.Candidates.PROCESS_ID, processId)

    query.orderBy(orderBy.column, orderBy.direction)

    query
      .limit(this.elementsPerPage)
      .offset((orderBy.page - 1 || 0) * this.elementsPerPage)

    return await query
  }

  /**
   * Conta o total de candidatos de um processo
   *
   * @param processId - ID do processo
   * @returns Número total de páginas
   */
  async findCandidatesQuantityByProcessId(processId: number) {
    const query = this.knex(db.Tables.CANDIDATES)
      .where(db.Candidates.PROCESS_ID, processId)
      .countDistinct(db.Candidates.CANDIDATE_ID)

    const [results] = await query
    const countKey = Object.keys(results)[0]
    const count = Number(results[countKey])
    return Math.ceil(count / this.elementsPerPage) || 0
  }

  /**
   * Busca FormCandidate por candidateId e sFormId
   *
   * @param candidateId - ID do candidato
   * @param sFormId - ID do formulário
   * @returns FormCandidate ou undefined
   */
  async findFormCandidateByCandidateAndForm(
    candidateId: number,
    sFormId: number
  ) {
    return this.knex(db.Tables.FORMS_CANDIDATES)
      .select(
        db.FormsCandidates.FORM_CANDIDATE_ID,
        db.FormsCandidates.FORM_CANDIDATE_STATUS
      )
      .where(db.FormsCandidates.CANDIDATE_ID, candidateId)
      .where(db.FormsCandidates.S_FORM_ID, sFormId)
      .first()
  }

  /**
   * Busca nome do usuário por userId
   *
   * @param userId - ID do usuário
   * @returns Nome do usuário ou null
   */
  async findUserNameById(userId: number): Promise<string | null> {
    const user = await this.knex(db.Tables.USERS)
      .select(db.Users.USER_NAME)
      .where(db.Users.USER_ID, userId)
      .first()

    return user ? user[db.Users.USER_NAME] : null
  }

  async updateFormCandidateStatus(
    candidateId: number,
    sFormId: number,
    status: number
  ): Promise<void> {
    await this.knex(db.Tables.FORMS_CANDIDATES)
      .where(db.FormsCandidates.CANDIDATE_ID, candidateId)
      .where(db.FormsCandidates.S_FORM_ID, sFormId)
      .update({
        [db.FormsCandidates.FORM_CANDIDATE_STATUS]: status
      })
  }

  /**
   * Busca dados do candidato e formulário para reenvio de email
   */
  async findCandidateAndFormDataForResend(
    candidateId: number,
    sFormId: number
  ): Promise<{
    sFormType: string
    candidateName: string
    candidateEmail: string
  } | null> {
    const result = await this.knex(db.Tables.CANDIDATES)
      .select(
        `${db.Tables.S_FORMS}.${db.SForms.S_FORM_TYPE} as sFormType`,
        `${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_NAME} as candidateName`,
        `${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_EMAIL} as candidateEmail`
      )
      .innerJoin(
        db.Tables.FORMS_CANDIDATES,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.CANDIDATE_ID}`,
        '=',
        `${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_ID}`
      )
      .innerJoin(
        db.Tables.S_FORMS,
        `${db.Tables.S_FORMS}.${db.SForms.S_FORM_ID}`,
        '=',
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.S_FORM_ID}`
      )
      .where(
        `${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_ID}`,
        candidateId
      )
      .andWhere(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.S_FORM_ID}`,
        sFormId
      )
      .first()

    return result || null
  }

  /**
   * Busca termos ativos para o papel de candidato
   */
  async findActiveTermsForCandidate(): Promise<any[]> {
    const today = new Date()

    return this.knex(db.Tables.TERMS)
      .select(
        db.Terms.TERM_ID,
        db.Terms.TERM_TEXT,
        db.Terms.TERM_TYPE_ID,
        db.Terms.ROLE_ID,
        db.Terms.BEGIN_DATE,
        db.Terms.END_DATE
      )
      .where(db.Terms.ROLE_ID, ERoles.CANDIDATE)
      .where(db.Terms.BEGIN_DATE, '<=', today)
      .where(function () {
        this.where(db.Terms.END_DATE, '>=', today).orWhereNull(
          db.Terms.END_DATE
        )
      })
  }

  /**
   * Busca termos ativos que não possuem assinatura ativa para o formCandidateId
   */
  async findUnsignedTermsForFormCandidate(
    formCandidateId: number,
    activeTermIds: number[]
  ): Promise<Term[]> {
    if (activeTermIds.length === 0) {
      return []
    }

    const signedTermIds = await this.knex(db.Tables.CANDIDATES_TERMS_SIGNATURES)
      .select(db.CandidatesTermsSignatures.TERM_ID)
      .where(db.CandidatesTermsSignatures.FORM_CANDIDATE_ID, formCandidateId)
      .whereNull(db.CandidatesTermsSignatures.TERM_UNSIGNED)
      .whereIn(db.CandidatesTermsSignatures.TERM_ID, activeTermIds)

    const signedIds = signedTermIds.map(
      (row) => row[db.CandidatesTermsSignatures.TERM_ID]
    )

    return this.knex(db.Tables.TERMS)
      .select(
        db.Terms.TERM_ID,
        db.Terms.TERM_TEXT,
        db.Terms.TERM_TYPE_ID,
        db.Terms.ROLE_ID,
        db.Terms.BEGIN_DATE,
        db.Terms.END_DATE
      )
      .whereIn(db.Terms.TERM_ID, activeTermIds)
      .whereNotIn(db.Terms.TERM_ID, signedIds)
  }

  /**
   * Busca dados básicos de um formulário por sFormId
   */
  async findFormById(sFormId: number): Promise<
    | {
        sFormId: number
        sFormName: string
      }
    | undefined
  > {
    return this.knex(db.Tables.S_FORMS)
      .select(db.SForms.S_FORM_ID, db.SForms.S_FORM_NAME)
      .where(db.SForms.S_FORM_ID, sFormId)
      .first()
  }

  /**
   * Busca seções de um formulário
   */
  async findSectionsByFormId(sFormId: number): Promise<
    Array<{
      formSectionId: number
      formSectionName: string
      formSectionOrder: number
    }>
  > {
    return this.knex(db.Tables.FORM_SECTIONS)
      .select(
        db.FormSections.FORM_SECTION_ID,
        db.FormSections.FORM_SECTION_NAME,
        db.FormSections.FORM_SECTION_ORDER
      )
      .where(db.FormSections.S_FORM_ID, sFormId)
      .orderBy(db.FormSections.FORM_SECTION_ORDER, 'asc')
  }

  /**
   * Busca questões de uma seção
   */
  async findQuestionsBySectionId(formSectionId: number): Promise<
    Array<{
      questionId: number
      questionOrder: number
      questionType: number
      questionStatement: string
      questionDescription: string
    }>
  > {
    return this.knex(db.Tables.QUESTIONS)
      .select(
        db.Questions.QUESTION_ID,
        db.Questions.QUESTION_ORDER,
        db.Questions.QUESTION_TYPE,
        db.Questions.QUESTION_STATEMENT,
        db.Questions.QUESTION_DESCRIPTION
      )
      .where(db.Questions.FORM_SECTION_ID, formSectionId)
      .orderBy(db.Questions.QUESTION_ORDER, 'asc')
  }

  /**
   * Busca opções de uma questão
   */
  async findOptionsByQuestionId(questionId: number): Promise<
    Array<{
      questionOptionId: number
      questionOptionType: number
      questionOptionValue: string
    }>
  > {
    return this.knex(db.Tables.QUESTION_OPTIONS)
      .select(
        db.QuestionOptions.QUESTION_OPTION_ID,
        db.QuestionOptions.QUESTION_OPTION_TYPE,
        db.QuestionOptions.QUESTION_OPTION_VALUE
      )
      .where(db.QuestionOptions.QUESTION_ID, questionId)
  }

  /**
   * Busca validações de uma questão
   */
  async findValidationsByQuestionId(questionId: number): Promise<
    Array<{
      validationType: number
      valueOne: string | null
      valueTwo: string | null
      valueThree: string | null
      valueFour: string | null
    }>
  > {
    return this.knex(db.Tables.VALIDATIONS)
      .select(
        db.Validations.VALIDATION_TYPE,
        db.Validations.VALUE_ONE,
        db.Validations.VALUE_TWO,
        db.Validations.VALUE_THREE,
        db.Validations.VALUE_FOUR
      )
      .where(db.Validations.QUESTION_ID, questionId)
  }

  /**
   * Busca subquestões de uma questão
   */
  async findSubQuestionsByQuestionId(questionId: number): Promise<
    Array<{
      subQuestionId: number
      subQuestionPosition: number
      subQuestionType: number
      subQuestionStatement: string
    }>
  > {
    return this.knex(db.Tables.SUB_QUESTIONS)
      .select(
        db.SubQuestions.SUB_QUESTION_ID,
        db.SubQuestions.SUB_QUESTION_POSITION,
        db.SubQuestions.SUB_QUESTION_TYPE,
        db.SubQuestions.SUB_QUESTION_STATEMENT
      )
      .where(db.SubQuestions.QUESTION_ID, questionId)
      .orderBy(db.SubQuestions.SUB_QUESTION_POSITION, 'asc')
  }

  /**
   * Busca opções de uma subquestão
   */
  async findSubQuestionOptions(subQuestionId: number): Promise<
    Array<{
      questionOptionId: number
      questionOptionType: number
      questionOptionValue: string
    }>
  > {
    return this.knex(db.Tables.SUB_QUESTION_OPTIONS)
      .select(
        db.SubQuestionOptions.QUESTION_OPTION_ID,
        db.SubQuestionOptions.QUESTION_OPTION_TYPE,
        db.SubQuestionOptions.QUESTION_OPTION_VALUE
      )
      .where(db.SubQuestionOptions.QUESTION_ID, subQuestionId)
  }

  /**
   * Busca validações de uma subquestão
   */
  async findSubValidations(subQuestionId: number): Promise<
    Array<{
      validationType: number
      valueOne: string | null
      valueTwo: string | null
      valueThree: string | null
      valueFour: string | null
    }>
  > {
    const subValidations = await this.knex(db.Tables.SUB_VALIDATIONS)
      .select(
        db.SubValidations.VALIDATION_TYPE,
        db.SubValidations.VALUE_ONE,
        db.SubValidations.VALUE_TWO,
        db.SubValidations.VALUE_THREE,
        db.SubValidations.VALUE_FOUR
      )
      .where(db.SubValidations.QUESTION_ID, subQuestionId)

    return subValidations
  }

  async findDependentQuestionsByQuestionId(questionId: number) {
    return await this.knex(db.Tables.QUESTIONS)
      .select(
        db.Questions.QUESTION_ID,
        db.Questions.QUESTION_DISPLAY_RULE,
        db.Questions.ANSWER_DISPLEY_RULE,
        db.Questions.ANSWER_DISPLAY_VALUE
      )
      .where(db.Questions.QUESTION_DISPLAY_LINK, questionId)
  }

  async findDependentSectionsByQuestionId(questionId: number) {
    return await this.knex(db.Tables.FORM_SECTIONS)
      .select(
        db.FormSections.FORM_SECTION_ID,
        db.FormSections.FORM_SECTION_DISPLAY_RULE,
        db.FormSections.ANSWER_DISPLEY_RULE,
        db.FormSections.ANSWER_DISPLAY_VALUE
      )
      .where(db.FormSections.QUESTION_DISPLAY_LINK, questionId)
  }

  async findAnswerByQuestionAndFormCandidate(
    questionId: number,
    formCandidateId: number
  ): Promise<Answer> {
    return await this.knex(db.Tables.ANSWERS)
      .select(
        db.Answers.QUESTION_ID,
        db.Answers.FORM_CANDIDATE_ID,
        db.Answers.ANSWER_VALUE,
        db.Answers.VALID_ANSWER
      )
      .where(db.Answers.QUESTION_ID, questionId)
      .where(db.Answers.FORM_CANDIDATE_ID, formCandidateId)
      .first()
  }

  /**
   * Insere assinaturas de termos para um candidato
   */
  async insertCandidateTermsSignatures(
    formCandidateId: number,
    termIds: number[]
  ): Promise<void> {
    if (termIds.length === 0) {
      return
    }

    await this.knex.transaction(async (trx) => {
      const termSignaturesToInsert = termIds.map((termId) => ({
        [db.CandidatesTermsSignatures.FORM_CANDIDATE_ID]: formCandidateId,
        [db.CandidatesTermsSignatures.TERM_ID]: termId,
        [db.CandidatesTermsSignatures.TERM_UNSIGNED]: null
      }))

      await trx(db.Tables.CANDIDATES_TERMS_SIGNATURES).insert(
        termSignaturesToInsert
      )
    })
  }

  /**
   * Verifica se um orderCode já foi utilizado por um candidato confirmado
   * @param orderCode Código do pedido
   * @returns true se já foi usado, false caso contrário
   */
  async isOrderCodeInCandidates(orderCode: string): Promise<boolean> {
    const result = await this.knex(db.Tables.CANDIDATES)
      .count('* as count')
      .where(db.Candidates.CANDIDATE_ORDER_CODE, orderCode)
      .first()

    return result ? Number(result.count) > 0 : false
  }

  /**
   * Verifica se um candidato já existe em um processo específico
   * Busca por documento único
   * @param processId ID do processo
   * @param uniqueDocument Documento único (CPF/CNPJ criptografado)
   * @returns true se existe, false caso contrário
   */
  async candidateExistsInProcess(
    processId: number,
    uniqueDocument: string
  ): Promise<boolean> {
    const result = await this.knex(db.Tables.CANDIDATES)
      .count('* as count')
      .where(db.Candidates.PROCESS_ID, processId)
      .where(db.Candidates.CANDIDATE_UNIQUE_DOCUMENT, uniqueDocument)
      .first()

    return result ? Number(result.count) > 0 : false
  }

  /**
   * Busca um processo por ID
   * @param processId ID do processo
   * @returns Processo ou undefined
   */
  async findProcessById(processId: number): Promise<Process | undefined> {
    return this.knex(db.Tables.PROCESSES)
      .select('*')
      .where(db.Processes.PROCESS_ID, processId)
      .first()
  }

  /**
   * Insere um candidato confirmado a partir de um pending candidate
   * @param data Dados do candidato para inserir
   * @returns ID do candidato inserido
   */
  async insertCandidateFromPending(data: {
    processId: number
    candidateName: string
    candidateDocumentType: string
    candidateUniqueDocument: string
    candidateEmail: string
    candidatePhone: string
    candidateOrderCode: string
  }): Promise<number> {
    const [id] = await this.knex(db.Tables.CANDIDATES)
      .insert({
        [db.Candidates.PROCESS_ID]: data.processId,
        [db.Candidates.CANDIDATE_NAME]: data.candidateName,
        [db.Candidates.CANDIDATE_DOCUMENT_TYPE]: data.candidateDocumentType,
        [db.Candidates.CANDIDATE_UNIQUE_DOCUMENT]: data.candidateUniqueDocument,
        [db.Candidates.CANDIDATE_EMAIL]: data.candidateEmail,
        [db.Candidates.CANDIDATE_PHONE]: data.candidatePhone,
        [db.Candidates.CANDIDATE_ORDER_CODE]: data.candidateOrderCode,
        [db.Candidates.CANDIDATE_ORDER_CODE_VALIDATED_AT]: this.knex.fn.now()
      })
      .returning(db.Candidates.CANDIDATE_ID)

    return typeof id === 'object' ? id[db.Candidates.CANDIDATE_ID] : id
  }

  /**
   * Busca um candidato por orderCode
   * @param orderCode Código do pedido
   * @returns Candidato ou undefined
   */
  async findCandidateByOrderCode(
    orderCode: string
  ): Promise<{ candidateId: number } | undefined> {
    return this.knex(db.Tables.CANDIDATES)
      .select(db.Candidates.CANDIDATE_ID)
      .where(db.Candidates.CANDIDATE_ORDER_CODE, orderCode)
      .first()
  }

  /**
   * Insere um candidato completo com todos os campos
   * (usado após complementação de cadastro)
   *
   * @param data Dados completos do candidato
   * @returns ID do candidato inserido
   */
  async insertCompleteCandidate(
    data: InsertCompleteCandidate
  ): Promise<number> {
    const [id] = await this.knex(db.Tables.CANDIDATES)
      .insert({
        [db.Candidates.PROCESS_ID]: data.processId,
        [db.Candidates.CANDIDATE_NAME]: data.candidateName,
        [db.Candidates.CANDIDATE_DOCUMENT_TYPE]: data.candidateDocumentType,
        [db.Candidates.CANDIDATE_UNIQUE_DOCUMENT]: data.candidateUniqueDocument,
        [db.Candidates.CANDIDATE_EMAIL]: data.candidateEmail,
        [db.Candidates.CANDIDATE_PHONE]: data.candidatePhone,
        [db.Candidates.CANDIDATE_ORDER_CODE]: data.candidateOrderCode,
        [db.Candidates.CANDIDATE_ORDER_CODE_VALIDATED_AT]: this.knex.fn.now(),
        [db.Candidates.CANDIDATE_BIRTHDATE]: data.candidateBirthdate,
        [db.Candidates.CANDIDATE_FOREIGNER]: data.candidateForeigner,
        [db.Candidates.CANDIDATE_ADDRESS]: data.candidateAddress,
        [db.Candidates.CANDIDATE_ADDRESS_NUMBER]: data.candidateAddressNumber,
        [db.Candidates.CANDIDATE_DISTRICT]: data.candidateDistrict,
        [db.Candidates.CANDIDATE_CITY]: data.candidateCity,
        [db.Candidates.CANDIDATE_STATE]: data.candidateState,
        [db.Candidates.CANDIDATE_ZIP_CODE]: data.candidateZipCode,
        [db.Candidates.CANDIDATE_COUNTRY]: data.candidateCountry,
        [db.Candidates.CANDIDATE_MARITAL_STATUS]: data.candidateMaritalStatus
      })
      .returning(db.Candidates.CANDIDATE_ID)

    return typeof id === 'object' ? id[db.Candidates.CANDIDATE_ID] : id
  }

  /**
   * Busca todos os usuários ativos com papel de entrevistador
   * @returns Array de IDs de usuários entrevistadores ativos
   */
  async findActiveInterviewers(): Promise<number[]> {
    const interviewers = await this.knex(db.Tables.USERS_ROLES)
      .select(`${db.Tables.USERS_ROLES}.${db.UsersRoles.USER_ID}`)
      .innerJoin(
        db.Tables.USERS,
        `${db.Tables.USERS}.${db.Users.USER_ID}`,
        `${db.Tables.USERS_ROLES}.${db.UsersRoles.USER_ID}`
      )
      .where(`${db.Tables.USERS_ROLES}.${db.UsersRoles.ROLE_ID}`, ERoles.INTERV)
      .where(`${db.Tables.USERS_ROLES}.${db.UsersRoles.USER_ROLE_ACTIVE}`, true)
      .where(`${db.Tables.USERS}.${db.Users.USER_ACTIVE}`, true)
      .distinct()

    return interviewers.map((row) => row[db.UsersRoles.USER_ID])
  }

  /**
   * Busca candidatos de um processo para distribuição entre entrevistadores
   * Apenas retorna candidatos que:
   * - Possuem approved = true
   * - Possuem TODOS os formulários com status COMPLETED (8) ou UNUSEFULL (0)
   * @param processId ID do processo
   * @returns Array de candidatos com dados necessários para distribuição
   */
  async findCandidatesForDistribution(processId: number): Promise<
    Array<{
      candidateId: number
      candidateBirthdate: string
      candidateMaritalStatus: string | null
    }>
  > {
    // Buscar candidatos que possuem apenas FormsCandidates com status 0 ou 8
    // Exclui candidatos que possuem algum FormCandidate com status diferente
    const candidatesWithInvalidForms = await this.knex(
      db.Tables.FORMS_CANDIDATES
    )
      .select(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.CANDIDATE_ID}`
      )
      .innerJoin(
        db.Tables.CANDIDATES,
        `${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_ID}`,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.CANDIDATE_ID}`
      )
      .where(`${db.Tables.CANDIDATES}.${db.Candidates.PROCESS_ID}`, processId)
      .whereNotIn(db.FormsCandidates.FORM_CANDIDATE_STATUS, [0, 8])
      .groupBy(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.CANDIDATE_ID}`
      )

    const excludedCandidateIds = candidatesWithInvalidForms.map(
      (row) => row[db.FormsCandidates.CANDIDATE_ID]
    )

    const query = this.knex(db.Tables.CANDIDATES)
      .select(
        db.Candidates.CANDIDATE_ID,
        db.Candidates.CANDIDATE_BIRTHDATE,
        db.Candidates.CANDIDATE_MARITAL_STATUS
      )
      .where(db.Candidates.PROCESS_ID, processId)
      .where(db.Candidates.APPROVED, true)

    if (excludedCandidateIds.length > 0) {
      query.whereNotIn(db.Candidates.CANDIDATE_ID, excludedCandidateIds)
    }

    return query
  }

  /**
   * Atualiza o entrevistador de múltiplos candidatos em lote
   * @param assignments Array de objetos {candidateId, interviewUserId}
   */
  async updateCandidatesInterviewers(
    assignments: Array<{ candidateId: number; interviewUserId: number }>
  ): Promise<void> {
    if (assignments.length === 0) {
      return
    }

    await this.knex.transaction(async (trx) => {
      for (const assignment of assignments) {
        await trx(db.Tables.CANDIDATES)
          .where(db.Candidates.CANDIDATE_ID, assignment.candidateId)
          .update({
            [db.Candidates.INTERVIEW_USER_ID]: assignment.interviewUserId
          })
      }
    })
  }

  /**
   * Atribui um entrevistador a um candidato específico
   * @param candidateId ID do candidato
   * @param interviewUserId ID do entrevistador
   */
  async assignInterviewerToCandidate(
    candidateId: number,
    interviewUserId: number
  ): Promise<void> {
    await this.knex(db.Tables.CANDIDATES)
      .where(db.Candidates.CANDIDATE_ID, candidateId)
      .update({
        [db.Candidates.INTERVIEW_USER_ID]: interviewUserId
      })
  }

  /**
   * Busca candidatos de um processo atribuídos a um entrevistador específico
   * Retorna informações básicas de identificação (dados criptografados)
   *
   * @param processId - ID do processo
   * @param interviewUserId - ID do entrevistador
   * @returns Array com informações básicas dos candidatos (dados criptografados)
   */
  async findCandidatesByProcessAndInterviewer(
    processId: number,
    interviewUserId: number
  ) {
    return this.knex(db.Tables.CANDIDATES)
      .select(
        db.Candidates.CANDIDATE_ID,
        db.Candidates.CANDIDATE_NAME,
        db.Candidates.CANDIDATE_EMAIL,
        db.Candidates.CANDIDATE_UNIQUE_DOCUMENT
      )
      .where(db.Candidates.PROCESS_ID, processId)
      .where(db.Candidates.INTERVIEW_USER_ID, interviewUserId)
      .orderBy(db.Candidates.CANDIDATE_NAME, 'asc')
  }

  /**
   * Atualiza o status de aprovação de um candidato
   * @param candidateId ID do candidato
   * @param approved Status de aprovação (true/false)
   */
  async updateCandidateApproval(
    candidateId: number,
    approved: boolean
  ): Promise<void> {
    await this.knex(db.Tables.CANDIDATES)
      .where(db.Candidates.CANDIDATE_ID, candidateId)
      .update({
        [db.Candidates.APPROVED]: approved
      })
  }

  /**
   * Busca informações do candidato e seu processo para validação
   * @param candidateId ID do candidato
   * @returns Dados do candidato e processo
   */
  async findCandidateWithProcess(candidateId: number) {
    return this.knex(db.Tables.CANDIDATES)
      .select(
        `${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_ID}`,
        `${db.Tables.CANDIDATES}.${db.Candidates.PROCESS_ID}`,
        `${db.Tables.CANDIDATES}.${db.Candidates.APPROVED}`,
        `${db.Tables.PROCESSES}.${db.Processes.PROCESS_END_DATE}`
      )
      .innerJoin(
        db.Tables.PROCESSES,
        `${db.Tables.CANDIDATES}.${db.Candidates.PROCESS_ID}`,
        `${db.Tables.PROCESSES}.${db.Processes.PROCESS_ID}`
      )
      .where(
        `${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_ID}`,
        candidateId
      )
      .first()
  }
}
