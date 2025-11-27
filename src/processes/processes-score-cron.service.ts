import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectConnection } from 'nest-knexjs'
import { Knex } from 'knex'
import * as db from '../constants/db-schema.enum'
import { EScoreType } from '../constants/score-types.enum'

@Injectable()
export class ProcessesScoreCronService {
  private readonly logger = new Logger(ProcessesScoreCronService.name)

  constructor(@InjectConnection('knexx') private readonly knex: Knex) {}

  // Cron job que roda todo dia às 3h da manhã
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async calculateCandidatesScores() {
    this.logger.log('🔄 Iniciando cálculo de scores dos candidatos...')

    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]

      // 1. Buscar processos elegíveis: prazo de resposta já passou mas processo ainda ativo
      const processes = await this.knex(db.Tables.PROCESSES)
        .select(
          db.Processes.PROCESS_ID,
          db.Processes.CUTOFF_SCORE,
          db.Processes.PROCESS_TITLE
        )
        .whereNotNull(db.Processes.CUTOFF_SCORE)
        .where(db.Processes.PROCESS_END_ANSWERS, '<', todayStr)
        .where(db.Processes.PROCESS_END_DATE, '>=', todayStr)

      this.logger.log(
        `📊 Encontrados ${processes.length} processos com score de corte`
      )

      for (const process of processes) {
        await this.processScoreCalculation(process)
      }

      this.logger.log('✅ Cálculo de scores concluído com sucesso!')
    } catch (error) {
      this.logger.error('❌ Erro ao calcular scores:', error)
    }
  }

  private async processScoreCalculation(process: any) {
    const processId = process[db.Processes.PROCESS_ID]
    const cutoffScore = parseFloat(process[db.Processes.CUTOFF_SCORE])
    const processTitle = process[db.Processes.PROCESS_TITLE]

    this.logger.log(`🎯 Processando: ${processTitle} (cutoff: ${cutoffScore})`)

    // 2. Buscar candidatos com approved = null
    const candidates = await this.knex(db.Tables.CANDIDATES)
      .select(db.Candidates.CANDIDATE_ID, db.Candidates.CANDIDATE_NAME)
      .where(db.Candidates.PROCESS_ID, processId)
      .whereNull(db.Candidates.APPROVED)

    this.logger.log(`👥 ${candidates.length} candidatos para processar`)

    for (const candidate of candidates) {
      await this.calculateCandidateScore(
        candidate[db.Candidates.CANDIDATE_ID],
        candidate[db.Candidates.CANDIDATE_NAME],
        cutoffScore
      )
    }
  }

  private async calculateCandidateScore(
    candidateId: number,
    candidateName: string,
    cutoffScore: number
  ) {
    try {
      let totalScore = 0

      // 3. Buscar todos formsCandidates do candidato
      const formsCandidates = await this.knex(db.Tables.FORMS_CANDIDATES)
        .select(
          db.FormsCandidates.FORM_CANDIDATE_ID,
          db.FormsCandidates.S_FORM_ID
        )
        .where(db.FormsCandidates.CANDIDATE_ID, candidateId)

      for (const formCandidate of formsCandidates) {
        const formCandidateId =
          formCandidate[db.FormsCandidates.FORM_CANDIDATE_ID]
        const sFormId = formCandidate[db.FormsCandidates.S_FORM_ID]

        // 4. Buscar questões com score do formulário
        const questionsWithScore = await this.getQuestionsWithScore(sFormId)

        // 5. Para cada questão, buscar resposta e calcular score
        for (const question of questionsWithScore) {
          const score = await this.calculateQuestionScore(
            formCandidateId,
            question
          )
          totalScore += score
        }
      }

      // 6. Atualizar approved baseado no score total
      if (totalScore < cutoffScore) {
        await this.knex(db.Tables.CANDIDATES)
          .where(db.Candidates.CANDIDATE_ID, candidateId)
          .update({ [db.Candidates.APPROVED]: true })

        this.logger.log(
          `✅ ${candidateName}: Score ${totalScore} < ${cutoffScore} - APROVADO`
        )
      } else {
        this.logger.log(
          `⚠️  ${candidateName}: Score ${totalScore} >= ${cutoffScore} - Aguardando revisão manual`
        )
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao calcular score de ${candidateName}:`, error)
    }
  }

  private async getQuestionsWithScore(sFormId: number) {
    // Buscar seções do formulário
    const sections = await this.knex(db.Tables.FORM_SECTIONS)
      .select(db.FormSections.FORM_SECTION_ID)
      .where(db.FormSections.S_FORM_ID, sFormId)

    const sectionIds = sections.map((s) => s[db.FormSections.FORM_SECTION_ID])

    if (sectionIds.length === 0) return []

    // Buscar questões com score
    const questions = await this.knex(db.Tables.QUESTIONS)
      .select(
        `${db.Tables.QUESTIONS}.${db.Questions.QUESTION_ID}`,
        `${db.Tables.QUESTIONS}.${db.Questions.QUESTION_TYPE}`,
        `${db.Tables.QUESTION_SCORES}.${db.QuestionScores.QUESTION_SCORE_ID}`,
        `${db.Tables.QUESTION_SCORES}.${db.QuestionScores.SCORE_TYPE}`,
        `${db.Tables.QUESTION_SCORES}.${db.QuestionScores.OPTION_SCORES_JSON}`,
        `${db.Tables.QUESTION_SCORES}.${db.QuestionScores.DATE_COMPARISON_TYPE}`,
        `${db.Tables.QUESTION_SCORES}.${db.QuestionScores.CUTOFF_DATE}`,
        `${db.Tables.QUESTION_SCORES}.${db.QuestionScores.DATE_SCORE}`
      )
      .innerJoin(
        db.Tables.QUESTION_SCORES,
        `${db.Tables.QUESTIONS}.${db.Questions.QUESTION_ID}`,
        `${db.Tables.QUESTION_SCORES}.${db.QuestionScores.QUESTION_ID}`
      )
      .whereIn(db.Questions.FORM_SECTION_ID, sectionIds)

    return questions
  }

  private async calculateQuestionScore(
    formCandidateId: number,
    question: any
  ): Promise<number> {
    const questionId = question[db.Questions.QUESTION_ID]
    const scoreType = question[db.QuestionScores.SCORE_TYPE]

    // Buscar resposta do candidato
    const answer = await this.knex(db.Tables.ANSWERS)
      .select(db.Answers.ANSWER_VALUE)
      .where(db.Answers.QUESTION_ID, questionId)
      .where(db.Answers.FORM_CANDIDATE_ID, formCandidateId)
      .first()

    if (!answer || !answer[db.Answers.ANSWER_VALUE]) {
      return 0 // Sem resposta = sem pontuação
    }

    const answerValue = answer[db.Answers.ANSWER_VALUE]

    if (scoreType === EScoreType.OPTION_BASED) {
      return this.calculateOptionBasedScore(question, answerValue)
    } else if (scoreType === EScoreType.DATE_BASED) {
      return this.calculateDateBasedScore(question, answerValue)
    }

    return 0
  }

  private calculateOptionBasedScore(
    question: any,
    answerValue: string
  ): number {
    const optionScoresJson = question[db.QuestionScores.OPTION_SCORES_JSON]

    if (!optionScoresJson) return 0

    // answerValue é o valor da opção escolhida
    const score = optionScoresJson[answerValue]

    return score !== undefined ? parseFloat(score.toString()) : 0
  }

  private calculateDateBasedScore(question: any, answerValue: string): number {
    const dateComparisonType = question[db.QuestionScores.DATE_COMPARISON_TYPE]
    const cutoffDate = question[db.QuestionScores.CUTOFF_DATE]
    const dateScore = parseFloat(
      question[db.QuestionScores.DATE_SCORE]?.toString() || '0'
    )

    if (!cutoffDate || !dateComparisonType) return 0

    const answerDate = new Date(answerValue)
    const cutoff = new Date(cutoffDate)

    if (dateComparisonType === 'BEFORE') {
      return answerDate < cutoff ? dateScore : 0
    } else if (dateComparisonType === 'ON_OR_AFTER') {
      return answerDate >= cutoff ? dateScore : 0
    }

    return 0
  }
}
