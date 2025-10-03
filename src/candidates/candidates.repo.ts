import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import * as db from '../constants/db-schema.enum'
import { Process } from 'src/processes/types'
import { CreateCandidate } from './types'

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
}
