import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import * as db from '../constants/db-schema.enum'

@Injectable()
export class RatesRepo {
  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  /**
   * Busca todos os FormsCandidates de um candidato com informações do formulário
   *
   * @param candidateId - ID do candidato
   * @returns Array com formCandidateId, sFormId e sFormName
   */
  async findFormsCandidatesByCandidateId(candidateId: number): Promise<
    {
      formCandidateId: number
      sFormId: number
      sFormName: string
    }[]
  > {
    return this.knex(db.Tables.FORMS_CANDIDATES)
      .select(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.FORM_CANDIDATE_ID} as formCandidateId`,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.S_FORM_ID} as sFormId`,
        `${db.Tables.S_FORMS}.${db.SForms.S_FORM_NAME} as sFormName`
      )
      .innerJoin(
        db.Tables.S_FORMS,
        `${db.Tables.S_FORMS}.${db.SForms.S_FORM_ID}`,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.S_FORM_ID}`
      )
      .where(db.FormsCandidates.CANDIDATE_ID, candidateId)
      .orderBy(`${db.Tables.S_FORMS}.${db.SForms.S_FORM_NAME}`, 'asc')
  }

  /**
   * Busca todas as respostas válidas de um candidato com detalhes completos
   * da questão e área de questão
   *
   * IMPORTANTE: Filtra apenas respostas com validAnswer = true
   *
   * @param candidateId - ID do candidato
   * @returns Array com todas as informações necessárias para InterviewAnswer
   */
  async findAnswersWithDetailsForCandidate(candidateId: number): Promise<
    {
      answerId: number
      answerValue: string | null
      answerComment: string | null
      validAnswer: boolean
      questionId: number
      questionOrder: number
      questionStatement: string
      questionAreaId: number
      questionAreaName: string
      questionAreaDescription: string
      sFormId: number
      formCandidateId: number
    }[]
  > {
    return this.knex(db.Tables.ANSWERS)
      .select(
        `${db.Tables.ANSWERS}.${db.Answers.ANSWER_ID} as answerId`,
        `${db.Tables.ANSWERS}.${db.Answers.ANSWER_VALUE} as answerValue`,
        `${db.Tables.ANSWERS}.${db.Answers.ANSWER_COMMENT} as answerComment`,
        `${db.Tables.ANSWERS}.${db.Answers.VALID_ANSWER} as validAnswer`,
        `${db.Tables.QUESTIONS}.${db.Questions.QUESTION_ID} as questionId`,
        `${db.Tables.QUESTIONS}.${db.Questions.QUESTION_ORDER} as questionOrder`,
        `${db.Tables.QUESTIONS}.${db.Questions.QUESTION_STATEMENT} as questionStatement`,
        `${db.Tables.QUESTIONS_AREAS}.${db.QuestionsAreas.QUESTION_AREA_ID} as questionAreaId`,
        `${db.Tables.QUESTIONS_AREAS}.${db.QuestionsAreas.QUESTION_AREA_NAME} as questionAreaName`,
        `${db.Tables.QUESTIONS_AREAS}.${db.QuestionsAreas.QUESTION_AREA_DESCRIPTION} as questionAreaDescription`,
        `${db.Tables.FORM_SECTIONS}.${db.FormSections.S_FORM_ID} as sFormId`,
        `${db.Tables.ANSWERS}.${db.Answers.FORM_CANDIDATE_ID} as formCandidateId`
      )
      .innerJoin(
        db.Tables.FORMS_CANDIDATES,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.FORM_CANDIDATE_ID}`,
        `${db.Tables.ANSWERS}.${db.Answers.FORM_CANDIDATE_ID}`
      )
      .innerJoin(
        db.Tables.QUESTIONS,
        `${db.Tables.QUESTIONS}.${db.Questions.QUESTION_ID}`,
        `${db.Tables.ANSWERS}.${db.Answers.QUESTION_ID}`
      )
      .innerJoin(
        db.Tables.QUESTIONS_AREAS,
        `${db.Tables.QUESTIONS_AREAS}.${db.QuestionsAreas.QUESTION_AREA_ID}`,
        `${db.Tables.QUESTIONS}.${db.Questions.QUESTION_AREA_ID}`
      )
      .innerJoin(
        db.Tables.FORM_SECTIONS,
        `${db.Tables.FORM_SECTIONS}.${db.FormSections.FORM_SECTION_ID}`,
        `${db.Tables.QUESTIONS}.${db.Questions.FORM_SECTION_ID}`
      )
      .where(
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.CANDIDATE_ID}`,
        candidateId
      )
      .where(`${db.Tables.ANSWERS}.${db.Answers.VALID_ANSWER}`, true)
      .orderBy(`${db.Tables.FORM_SECTIONS}.${db.FormSections.S_FORM_ID}`, 'asc')
      .orderBy(`${db.Tables.QUESTIONS}.${db.Questions.QUESTION_ORDER}`, 'asc')
  }

  /**
   * Verifica se um candidato pertence a um entrevistador
   *
   * @param candidateId - ID do candidato
   * @param interviewUserId - ID do entrevistador
   * @returns true se o candidato pertence ao entrevistador
   */
  async isCandidateAssignedToInterviewer(
    candidateId: number,
    interviewUserId: number
  ): Promise<boolean> {
    const result = await this.knex(db.Tables.CANDIDATES)
      .select(db.Candidates.CANDIDATE_ID)
      .where(db.Candidates.CANDIDATE_ID, candidateId)
      .where(db.Candidates.INTERVIEW_USER_ID, interviewUserId)
      .first()

    return !!result
  }

  /**
   * Verifica se uma resposta pertence a um candidato de um entrevistador específico
   *
   * @param answerId - ID da resposta
   * @param interviewUserId - ID do entrevistador
   * @returns true se a resposta pertence ao candidato do entrevistador
   */
  async isAnswerOwnedByInterviewer(
    answerId: number,
    interviewUserId: number
  ): Promise<boolean> {
    const result = await this.knex(db.Tables.ANSWERS)
      .innerJoin(
        db.Tables.FORMS_CANDIDATES,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.FORM_CANDIDATE_ID}`,
        `${db.Tables.ANSWERS}.${db.Answers.FORM_CANDIDATE_ID}`
      )
      .innerJoin(
        db.Tables.CANDIDATES,
        `${db.Tables.CANDIDATES}.${db.Candidates.CANDIDATE_ID}`,
        `${db.Tables.FORMS_CANDIDATES}.${db.FormsCandidates.CANDIDATE_ID}`
      )
      .select(`${db.Tables.ANSWERS}.${db.Answers.ANSWER_ID}`)
      .where(`${db.Tables.ANSWERS}.${db.Answers.ANSWER_ID}`, answerId)
      .where(
        `${db.Tables.CANDIDATES}.${db.Candidates.INTERVIEW_USER_ID}`,
        interviewUserId
      )
      .first()

    return !!result
  }

  /**
   * Atualiza o comentário de uma resposta
   *
   * @param answerId - ID da resposta
   * @param answerComment - Comentário a ser salvo
   */
  async updateAnswerComment(
    answerId: number,
    answerComment: string
  ): Promise<void> {
    await this.knex(db.Tables.ANSWERS)
      .where(db.Answers.ANSWER_ID, answerId)
      .update({ [db.Answers.ANSWER_COMMENT]: answerComment })
  }

  /**
   * Cria um novo rate
   *
   * @param rateData - Dados do rate a ser criado
   * @returns ID do rate criado
   */
  async createRate(rateData: {
    candidateId: number
    interviewerId: number
    questionAreaId: number
    rateValue?: number
    rateComment?: string
  }): Promise<number> {
    const [rateId] = await this.knex(db.Tables.RATES).insert({
      [db.Rates.CANDIDATE_ID]: rateData.candidateId,
      [db.Rates.INTERVIEWER_ID]: rateData.interviewerId,
      [db.Rates.QUESTION_AREA_ID]: rateData.questionAreaId,
      [db.Rates.RATE_VALUE]: rateData.rateValue || null,
      [db.Rates.RATE_COMMENT]: rateData.rateComment || null
    })

    return rateId
  }

  /**
   * Atualiza um rate existente
   *
   * @param rateId - ID do rate
   * @param rateData - Dados a serem atualizados
   */
  async updateRate(
    rateId: number,
    rateData: {
      rateValue?: number
      rateComment?: string
    }
  ): Promise<void> {
    const updateData: any = {}

    if (rateData.rateValue !== undefined) {
      updateData[db.Rates.RATE_VALUE] = rateData.rateValue
    }

    if (rateData.rateComment !== undefined) {
      updateData[db.Rates.RATE_COMMENT] = rateData.rateComment
    }

    await this.knex(db.Tables.RATES)
      .where(db.Rates.RATE_ID, rateId)
      .update(updateData)
  }

  /**
   * Verifica se um rate existe e pertence a um entrevistador específico
   *
   * @param rateId - ID do rate
   * @param interviewerId - ID do entrevistador
   * @returns true se o rate existe e pertence ao entrevistador
   */
  async isRateOwnedByInterviewer(
    rateId: number,
    interviewerId: number
  ): Promise<boolean> {
    const result = await this.knex(db.Tables.RATES)
      .select(db.Rates.RATE_ID)
      .where(db.Rates.RATE_ID, rateId)
      .where(db.Rates.INTERVIEWER_ID, interviewerId)
      .first()

    return !!result
  }

  /**
   * Verifica se já existe um rate para o candidato, entrevistador e área de questão
   *
   * @param candidateId - ID do candidato
   * @param interviewerId - ID do entrevistador
   * @param questionAreaId - ID da área de questão
   * @returns ID do rate se existir, null caso contrário
   */
  async findExistingRate(
    candidateId: number,
    interviewerId: number,
    questionAreaId: number
  ): Promise<number | null> {
    const result = await this.knex(db.Tables.RATES)
      .select(db.Rates.RATE_ID)
      .where(db.Rates.CANDIDATE_ID, candidateId)
      .where(db.Rates.INTERVIEWER_ID, interviewerId)
      .where(db.Rates.QUESTION_AREA_ID, questionAreaId)
      .first()

    return result ? result.rateId : null
  }

  /**
   * Busca a data de fim do processo associado a um candidato
   *
   * @param candidateId - ID do candidato
   * @returns Data de fim do processo
   */
  async getProcessEndDateByCandidate(
    candidateId: number
  ): Promise<string | null> {
    const result = await this.knex(db.Tables.CANDIDATES)
      .select(`${db.Tables.PROCESSES}.${db.Processes.PROCESS_END_DATE}`)
      .innerJoin(
        db.Tables.PROCESSES,
        `${db.Tables.PROCESSES}.${db.Processes.PROCESS_ID}`,
        `${db.Tables.CANDIDATES}.${db.Candidates.PROCESS_ID}`
      )
      .where(db.Candidates.CANDIDATE_ID, candidateId)
      .first()

    return result ? result.processEndDate : null
  }

  /**
   * Busca os detalhes de um rate
   *
   * @param rateId - ID do rate
   * @returns Detalhes do rate
   */
  async getRateDetails(rateId: number): Promise<{
    candidateId: number
    interviewerId: number
    questionAreaId: number
  } | null> {
    const result = await this.knex(db.Tables.RATES)
      .select(
        db.Rates.CANDIDATE_ID,
        db.Rates.INTERVIEWER_ID,
        db.Rates.QUESTION_AREA_ID
      )
      .where(db.Rates.RATE_ID, rateId)
      .first()

    return result
      ? {
          candidateId: result.candidateId,
          interviewerId: result.interviewerId,
          questionAreaId: result.questionAreaId
        }
      : null
  }

  /**
   * Busca todos os rates de um entrevistador para um candidato específico
   *
   * @param candidateId - ID do candidato
   * @param interviewerId - ID do entrevistador
   * @returns Array de rates com informações da área de questão
   */
  async findRatesByInterviewerAndCandidate(
    candidateId: number,
    interviewerId: number
  ): Promise<
    {
      rateId: number
      candidateId: number
      interviewerId: number
      questionAreaId: number
      questionAreaName: string
      questionAreaDescription: string
      rateValue: number | null
      rateComment: string | null
      createdAt: string
      updatedAt: string
    }[]
  > {
    return this.knex(db.Tables.RATES)
      .select(
        `${db.Tables.RATES}.${db.Rates.RATE_ID} as rateId`,
        `${db.Tables.RATES}.${db.Rates.CANDIDATE_ID} as candidateId`,
        `${db.Tables.RATES}.${db.Rates.INTERVIEWER_ID} as interviewerId`,
        `${db.Tables.RATES}.${db.Rates.QUESTION_AREA_ID} as questionAreaId`,
        `${db.Tables.QUESTIONS_AREAS}.${db.QuestionsAreas.QUESTION_AREA_NAME} as questionAreaName`,
        `${db.Tables.QUESTIONS_AREAS}.${db.QuestionsAreas.QUESTION_AREA_DESCRIPTION} as questionAreaDescription`,
        `${db.Tables.RATES}.${db.Rates.RATE_VALUE} as rateValue`,
        `${db.Tables.RATES}.${db.Rates.RATE_COMMENT} as rateComment`,
        `${db.Tables.RATES}.createdAt`,
        `${db.Tables.RATES}.updatedAt`
      )
      .innerJoin(
        db.Tables.QUESTIONS_AREAS,
        `${db.Tables.QUESTIONS_AREAS}.${db.QuestionsAreas.QUESTION_AREA_ID}`,
        `${db.Tables.RATES}.${db.Rates.QUESTION_AREA_ID}`
      )
      .where(db.Rates.CANDIDATE_ID, candidateId)
      .where(db.Rates.INTERVIEWER_ID, interviewerId)
      .orderBy(
        `${db.Tables.QUESTIONS_AREAS}.${db.QuestionsAreas.QUESTION_AREA_NAME}`,
        'asc'
      )
  }
}
