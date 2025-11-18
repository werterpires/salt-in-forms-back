import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import * as db from '../constants/db-schema.enum'
import { FormCandidate } from '../candidates/types'

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
}
