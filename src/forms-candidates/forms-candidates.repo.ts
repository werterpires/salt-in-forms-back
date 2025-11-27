import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import * as db from '../constants/db-schema.enum'
import {
  FormCandidate,
  CreateFormCandidate,
  ProcessInAnswerPeriod,
  SFormBasic,
  FormCandidateWithDetails,
  MinisterialFormCandidateContext,
  NormalFormCandidateContext
} from '../candidates/types'

@Injectable()
export class FormsCandidatesRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  async findFormCandidateByAccessCode(
    accessCode: string
  ): Promise<FormCandidate | undefined> {
    return this.knex(db.Tables.FORMS_CANDIDATES)
      .select('*')
      .where(db.FormsCandidates.FORM_CANDIDATE_ACCESS_CODE, accessCode)
      .first()
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

  async findCandidateIdByFormCandidateId(
    formCandidateId: number
  ): Promise<number | null> {
    const result = await this.knex(db.Tables.FORMS_CANDIDATES)
      .select(db.FormsCandidates.CANDIDATE_ID)
      .where(db.FormsCandidates.FORM_CANDIDATE_ID, formCandidateId)
      .first()

    return result ? result.candidateId : null
  }

  async updateFormCandidateStatus(
    formCandidateId: number,
    status: number
  ): Promise<void> {
    await this.knex(db.Tables.FORMS_CANDIDATES)
      .where(db.FormsCandidates.FORM_CANDIDATE_ID, formCandidateId)
      .update({
        [db.FormsCandidates.FORM_CANDIDATE_STATUS]: status
      })
  }

  async findFormCandidateWithProcessDetails(formCandidateId: number): Promise<{
    formCandidateStatus: number
    processEndAnswers: Date | null
  } | null> {
    const result = await this.knex(db.Tables.FORMS_CANDIDATES)
      .select(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.FORM_CANDIDATE_STATUS} as formCandidateStatus`,
        `${db.Tables.PROCESSES}.${db.Processes.PROCESS_END_ANSWERS} as processEndAnswers`
      )
      .innerJoin(
        db.Tables.S_FORMS,
        `${db.Tables.S_FORMS}.${db.SForms.S_FORM_ID}`,
        '=',
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.S_FORM_ID}`
      )
      .innerJoin(
        db.Tables.PROCESSES,
        `${db.Tables.PROCESSES}.${db.Processes.PROCESS_ID}`,
        '=',
        `${db.Tables.S_FORMS}.${db.SForms.PROCESS_ID}`
      )
      .where(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.FORM_CANDIDATE_ID}`,
        formCandidateId
      )
      .first()

    return result || null
  }

  async findAllQuestionsByFormCandidateId(
    formCandidateId: number
  ): Promise<number[]> {
    const result = await this.knex(db.Tables.QUESTIONS)
      .select(`${db.Tables.QUESTIONS}.${db.Questions.QUESTION_ID}`)
      .innerJoin(
        db.Tables.FORM_SECTIONS,
        `${db.Tables.FORM_SECTIONS}.${db.FormSections.FORM_SECTION_ID}`,
        '=',
        `${db.Tables.QUESTIONS}.${db.Questions.FORM_SECTION_ID}`
      )
      .innerJoin(
        db.Tables.S_FORMS,
        `${db.Tables.S_FORMS}.${db.SForms.S_FORM_ID}`,
        '=',
        `${db.Tables.FORM_SECTIONS}.${db.FormSections.S_FORM_ID}`
      )
      .innerJoin(
        db.Tables.FORMS_CANDIDATES,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.S_FORM_ID}`,
        '=',
        `${db.Tables.S_FORMS}.${db.SForms.S_FORM_ID}`
      )
      .where(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.FORM_CANDIDATE_ID}`,
        formCandidateId
      )
      .orderBy(`${db.Tables.QUESTIONS}.${db.Questions.QUESTION_ORDER}`, 'asc')

    return result.map((row) => row.questionId)
  }

  /**
   * Busca processos que estão no período de resposta
   * Usado pelo cron para processar candidatos confirmados
   */
  async findProcessesInAnswerPeriod(): Promise<ProcessInAnswerPeriod[]> {
    const today = new Date()

    return this.knex(db.Tables.PROCESSES)
      .select(db.Processes.PROCESS_ID, db.Processes.PROCESS_TITLE)
      .where(db.Processes.PROCESS_BEGIN_DATE, '<=', today)
      .where(db.Processes.PROCESS_END_ANSWERS, '>=', today)
      .orderBy(db.Processes.PROCESS_TITLE, 'asc')
  }

  /**
   * Busca formulários de um processo
   */
  async findSFormsByProcessId(processId: number): Promise<SFormBasic[]> {
    return this.knex(db.Tables.S_FORMS)
      .select(
        db.SForms.S_FORM_ID,
        db.SForms.S_FORM_TYPE,
        db.SForms.EMAIL_QUESTION_ID
      )
      .where(db.SForms.PROCESS_ID, processId)
      .orderBy(db.SForms.S_FORM_NAME, 'asc')
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
   * Insere FormsCandidates em batch e retorna IDs gerados
   */
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

  /**
   * Busca candidatos completos com seus FormsCandidates para envio de emails
   * Otimizado para evitar N+1 queries
   *
   * @param formsCandidatesIds - Array de IDs dos FormsCandidates
   * @returns Array com dados completos para envio de email
   */
  async findCandidatesWithFormsCandidatesByIds(
    formsCandidatesIds: number[]
  ): Promise<FormCandidateWithDetails[]> {
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

  /**
   * Atualiza status do FormCandidate
   * Versão para uso em cron (recebe candidateId e sFormId)
   */
  async updateFormCandidateStatusByCandidateAndForm(
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
   * Busca formCandidates ministeriais com status GENERATED
   * Retorna contexto completo incluindo todos os formCandidateIds do candidato
   * Query otimizada com subquery para agregar formCandidateIds
   *
   * @param sFormId - ID do formulário ministerial
   * @param emailQuestionId - ID da questão que contém o email/field
   * @returns Array com contexto completo para processamento
   */
  async findMinisterialFormCandidatesWithContext(
    sFormId: number,
    emailQuestionId: number
  ): Promise<MinisterialFormCandidateContext[]> {
    // Subquery para buscar todos os formCandidateIds do mesmo candidato
    const subquery = this.knex(db.Tables.FORMS_CANDIDATES)
      .select(`${db.FormsCandidates.CANDIDATE_ID} as candidateId`)
      .select(
        this.knex.raw(
          `JSON_ARRAYAGG(${db.FormsCandidates.FORM_CANDIDATE_ID}) as candidateFormCandidateIds`
        )
      )
      .groupBy(db.FormsCandidates.CANDIDATE_ID)
      .as('fc_grouped')

    const results = await this.knex(db.Tables.FORMS_CANDIDATES)
      .select(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.FORM_CANDIDATE_ID} as formCandidateId`,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.CANDIDATE_ID} as candidateId`,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.S_FORM_ID} as sFormId`,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.FORM_CANDIDATE_ACCESS_CODE} as formCandidateAccessCode`,
        `${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_NAME} as candidateName`,
        this.knex.raw(`? as emailQuestionId`, [emailQuestionId]),
        this.knex.raw(
          `fc_grouped.candidateFormCandidateIds as candidateFormCandidateIds`
        )
      )
      .innerJoin(
        db.Tables.CANDIDATES,
        `${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_ID}`,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.CANDIDATE_ID}`
      )
      .innerJoin(subquery, function () {
        this.on(
          `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.CANDIDATE_ID}`,
          '=',
          'fc_grouped.candidateId'
        )
      })
      .where(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.S_FORM_ID}`,
        sFormId
      )
      .where(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.FORM_CANDIDATE_STATUS}`,
        1 // FormCandidateStatus.GENERATED
      )

    // Parse JSON arrays to actual arrays
    return results.map((row) => ({
      ...row,
      candidateFormCandidateIds:
        typeof row.candidateFormCandidateIds === 'string'
          ? JSON.parse(row.candidateFormCandidateIds)
          : row.candidateFormCandidateIds
    }))
  }

  /**
   * Busca formCandidates do tipo "normal" com status GENERATED
   * Retorna contexto completo incluindo todos os formCandidateIds do candidato
   * Similar ao método ministerial, mas para formulários normais
   *
   * @param sFormId - ID do formulário normal
   * @param emailQuestionId - ID da questão que contém o email
   * @returns Array com contexto completo para processamento
   */
  async findNormalFormCandidatesWithContext(
    sFormId: number,
    emailQuestionId: number
  ): Promise<NormalFormCandidateContext[]> {
    // Subquery para buscar todos os formCandidateIds do mesmo candidato
    const subquery = this.knex(db.Tables.FORMS_CANDIDATES)
      .select(db.FormsCandidates.CANDIDATE_ID)
      .select(
        this.knex.raw(
          `JSON_ARRAYAGG(${db.FormsCandidates.FORM_CANDIDATE_ID}) as candidateFormCandidateIds`
        )
      )
      .groupBy(db.FormsCandidates.CANDIDATE_ID)
      .as('fc_grouped')

    const results = await this.knex(db.Tables.FORMS_CANDIDATES)
      .select(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.FORM_CANDIDATE_ID} as formCandidateId`,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.CANDIDATE_ID} as candidateId`,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.S_FORM_ID} as sFormId`,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.FORM_CANDIDATE_ACCESS_CODE} as formCandidateAccessCode`,
        `${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_NAME} as candidateName`,
        this.knex.raw(`? as emailQuestionId`, [emailQuestionId]),
        this.knex.raw(
          `fc_grouped.candidateFormCandidateIds as candidateFormCandidateIds`
        )
      )
      .innerJoin(
        db.Tables.CANDIDATES,
        `${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_ID}`,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.CANDIDATE_ID}`
      )
      .innerJoin(subquery, function () {
        this.on(
          `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.CANDIDATE_ID}`,
          '=',
          'fc_grouped.candidateId'
        )
      })
      .where(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.S_FORM_ID}`,
        sFormId
      )
      .where(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.FORM_CANDIDATE_STATUS}`,
        1 // FormCandidateStatus.GENERATED
      )

    // Parse JSON arrays to actual arrays
    return results.map((row) => ({
      ...row,
      candidateFormCandidateIds:
        typeof row.candidateFormCandidateIds === 'string'
          ? JSON.parse(row.candidateFormCandidateIds)
          : row.candidateFormCandidateIds
    }))
  }
}
