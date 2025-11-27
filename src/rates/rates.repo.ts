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
}
