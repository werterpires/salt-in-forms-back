import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import * as db from '../constants/db-schema.enum'
import { Process } from 'src/processes/types'
import { CreateCandidate, CreateFormCandidate, FormCandidate } from './types'
import { ERoles } from '../constants/roles.const'
import { Term } from 'src/terms/types'

@Injectable()
export class CandidatesRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async findProcessInSubscription(): Promise<Process[]> {
    const today = new Date()
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(today.getDate() - 3)

    return this.knex(db.Tables.PROCESSES)
      .select(
        db.Processes.PROCESS_ID,
        db.Processes.PROCESS_TITLE,
        db.Processes.PROCESS_TOTVS_ID,
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
        db.Processes.PROCESS_TOTVS_ID,
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

    const candidateIds = candidatesInProcess.map(
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
    return this.knex(db.Tables.QUESTIONS)
      .select(
        db.Questions.QUESTION_ID,
        db.Questions.QUESTION_DISPLAY_RULE,
        db.Questions.ANSWER_DISPLEY_RULE,
        db.Questions.ANSWER_DISPLAY_VALUE
      )
      .where(db.Questions.QUESTION_DISPLAY_LINK, questionId)
  }

  async findDependentSectionsByQuestionId(questionId: number) {
    return this.knex(db.Tables.FORM_SECTIONS)
      .select(
        db.FormSections.FORM_SECTION_ID,
        db.FormSections.FORM_SECTION_DISPLAY_RULE,
        db.FormSections.ANSWER_DISPLEY_RULE,
        db.FormSections.ANSWER_DISPLAY_VALUE
      )
      .where(db.FormSections.QUESTION_DISPLAY_LINK, questionId)
  }
}