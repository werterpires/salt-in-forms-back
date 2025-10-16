import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import * as db from '../constants/db-schema.enum'
import { Process } from 'src/processes/types'
import { CreateCandidate, CreateFormCandidate, FormCandidate } from './types'
import { ERoles } from '../constants/roles.const'

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
        sFormId
      )
      .where(`${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_ID}`, candidateId)
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
        this.where(db.Terms.END_DATE, '>=', today).orWhereNull(db.Terms.END_DATE)
      })
  }

  /**
   * Busca termos ativos que não possuem assinatura ativa para o formCandidateId
   */
  async findUnsignedTermsForFormCandidate(
    formCandidateId: number,
    activeTermIds: number[]
  ): Promise<any[]> {
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
}
