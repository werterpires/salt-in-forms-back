import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CandidatesRepo } from './candidates.repo'
import { ExternalApiService } from '../shared/utils-module/external-api/external-api.service'
import { EncryptionService } from '../shared/utils-module/encryption/encryption.service'
import {
  CreateCandidate,
  CreateFormCandidate,
  FormToAnswer,
  SectionToAnswer,
  QuestionToAnswer,
  SubQuestionToAnswer,
  ProcessInAnswerPeriod,
  SFormBasic,
  FormCandidateWithDetails
} from './types'
import { CustomLoggerService } from 'src/shared/utils-module/custom-logger/custom-logger.service'
import { SendPulseEmailService } from '../shared/utils-module/email-sender/sendpulse-email.service'
import {
  createAccessCode,
  transformApiItemToCandidate,
  prepareCandidateEmailData,
  getFrontendUrl,
  decryptAnswer
} from './candidates.helper'
import { FormCandidateStatus } from 'src/constants/form-candidate-status.const'
import { getCandidateFormAccessEmailTemplate } from './email-templates/candidate-form-access.template'
import { getImportSummaryEmailTemplate } from './email-templates/import-summary.template'
import { Term } from 'src/terms/types'
import { FormsCandidatesService } from 'src/forms-candidates/forms-candidates.service'
import { Process } from 'src/processes/types'
import { AnswerWithoutId } from 'src/answers/types'

@Injectable()
export class CandidatesService {
  constructor(
    private readonly candidatesRepo: CandidatesRepo,
    private readonly externalApiService: ExternalApiService,
    private readonly encryptionService: EncryptionService,
    private readonly loggger: CustomLoggerService,
    private readonly sendPulseEmailService: SendPulseEmailService,
    private readonly formsCandidatesService: FormsCandidatesService
  ) {}

  /**
   * Processa candidatos de processos que estão no período de respostas
   * Gera códigos de acesso e envia emails apenas para formulários do tipo "candidate"
   */
  async handleProcessesInAnswerPeriod() {
    this.loggger.info(
      '\n=== Executando cron: Buscar processos no período de respostas ==='
    )

    const processes: ProcessInAnswerPeriod[] =
      await this.candidatesRepo.findProcessesInAnswerPeriod()

    this.loggger.info(
      `\n=== Total de processos encontrados: ${processes.length} ===`
    )

    for (const process of processes) {
      // Buscar formulários do processo
      const sForms: SFormBasic[] =
        await this.candidatesRepo.findSFormsByProcessId(process.processId)

      // Buscar candidatos que não estão na tabela FormsCandidates
      const candidatesNotInFormsCandidates: number[] =
        await this.candidatesRepo.findCandidatesNotInFormsCandidatesByProcessId(
          process.processId
        )

      if (candidatesNotInFormsCandidates.length > 0 && sForms.length > 0) {
        const formsCandidatesData: CreateFormCandidate[] = []

        // Gerar códigos de acesso para cada combinação candidato-formulário
        for (const candidateId of candidatesNotInFormsCandidates) {
          for (const sForm of sForms) {
            formsCandidatesData.push({
              candidateId: candidateId,
              sFormId: sForm.sFormId,
              formCandidateStatus: FormCandidateStatus.GENERATED,
              formCandidateAccessCode: createAccessCode()
            })
          }
        }

        // Inserir FormsCandidates em batch e obter IDs gerados
        const insertedIds: number[] =
          await this.candidatesRepo.insertFormsCandidatesInBatch(
            formsCandidatesData
          )

        this.loggger.info(
          `\n=== ${formsCandidatesData.length} códigos de acesso gerados ===`
        )

        // Enviar emails apenas para formulários do tipo "candidate"
        await this.sendEmailsForCandidateForms(insertedIds)
      }
    }
  }

  /**
   * Cron que busca candidatos de processos em período de inscrição
   * Executa diariamente às 11:45
   */
  @Cron('40 15 * * *')
  async handleProcessInSubscriptionCron() {
    const processes: Process[] =
      await this.candidatesRepo.findProcessInSubscription()

    const baseUrl = process.env.PROCESS_CANDIDATES_API

    if (!baseUrl) {
      this.loggger.error('#PROCESS_CANDIDATES_API não está definido no .env')
      return
    }

    const allCandidates: CreateCandidate[] = []

    // Buscar candidatos de cada processo
    for (const process of processes) {
      try {
        const apiUrl = `${baseUrl}${process.processTotvsId}`
        const response: { data: any[] } =
          await this.externalApiService.get(apiUrl)

        this.loggger.info(
          `Resposta da API para processo ${process.processTotvsId}:`,
          response.data.toString()
        )

        // Transformar dados da API em candidatos
        const candidates: CreateCandidate[] = this.parseApiResponseToCandidates(
          response.data,
          process.processId
        )

        this.loggger.info(
          `\n=== Candidatos coletados para processo ${process.processTitle} ===`
        )

        allCandidates.push(...candidates)
      } catch (error) {
        this.loggger.error(
          `Erro ao buscar candidatos do processo ${process.processTotvsId}:`,
          error.stack
        )
      }
    }

    // Processar inserção dos candidatos
    if (allCandidates.length > 0) {
      await this.processCandidatesInsertion(allCandidates)
    } else {
      this.loggger.info('\n=== Nenhum candidato encontrado para inserir ===')
      await this.sendImportSummaryEmail(0, 0, 0)
    }

    // Processar candidatos no período de respostas
    await this.handleProcessesInAnswerPeriod()
  }

  /**
   * Cron para processar formulários do tipo "normal" e "ministerial"
   * TODO: Implementar quando a tabela de respostas estiver disponível
   *
   * Lógica necessária:
   * 1. Buscar candidatos que completaram formulário "candidate"
   * 2. Para formulários "normal": buscar resposta da pergunta vinculada (emailQuestionId)
   * 3. Enviar email para o endereço encontrado na resposta
   * 4. Para formulários "ministerial": implementar lógica específica
   */
  @Cron('0 */2 * * *') // A cada 2 horas
  handleNormalAndMinisterialForms() {
    this.loggger.info(
      '\n=== ATENÇÃO: Cron de formulários "normal" e "ministerial" não implementado ==='
    )
    this.loggger.info(
      'Motivo: Tabela de respostas das questions ainda não está disponível'
    )
    this.loggger.info('Quando implementar, este cron deve:')
    this.loggger.info(
      '1. Buscar candidatos que completaram o formulário "candidate"'
    )
    this.loggger.info(
      '2. Para formulários "normal": buscar resposta da pergunta vinculada (emailQuestionId)'
    )
    this.loggger.info('3. Enviar email para o endereço encontrado na resposta')
    this.loggger.info(
      '4. Para formulários "ministerial": implementar lógica específica'
    )
  }

  /**
   * Valida um código de acesso
   * Se expirado (>24h), gera novo código e reenvia email conforme tipo do formulário
   * Se válido, verifica termos ativos não assinados para o candidato
   * Retorna Terms[] se houver termos pendentes, ou FormToAnswer se não houver
   */
  async validateAccessCode(accessCode: string): Promise<Term[] | FormToAnswer> {
    await this.formsCandidatesService.validateAccessCodeAndGetFormCandidateId(
      accessCode
    )

    const formCandidate =
      await this.candidatesRepo.findFormCandidateByAccessCode(accessCode)

    if (!formCandidate) {
      throw new Error(
        '#Candidato não encontrado para o código de acesso fornecido.'
      )
    }

    // Buscar termos ativos para candidatos
    const activeTerms = await this.candidatesRepo.findActiveTermsForCandidate()

    if (activeTerms.length > 0) {
      const activeTermIds = activeTerms.map((term) => term.termId)

      // Buscar termos não assinados para este formCandidate
      const unsignedTerms =
        await this.candidatesRepo.findUnsignedTermsForFormCandidate(
          formCandidate.formCandidateId,
          activeTermIds
        )

      // Se há termos não assinados, retorna eles
      if (unsignedTerms.length > 0) {
        return unsignedTerms
      }
    }

    // Se não há termos pendentes, montar o FormToAnswer
    return await this.buildFormToAnswer(
      formCandidate.sFormId,
      formCandidate.formCandidateId
    )
  }

  /**
   * Monta o FormToAnswer buscando cada parte separadamente
   */
  private async buildFormToAnswer(
    sFormId: number,
    formCandidateId: number
  ): Promise<FormToAnswer> {
    // 1. Buscar o formulário
    const form = await this.candidatesRepo.findFormById(sFormId)

    if (!form) {
      throw new Error('#Formulário não encontrado.')
    }

    // 2. Buscar as seções do formulário
    const sections = await this.candidatesRepo.findSectionsByFormId(sFormId)

    // 3. Para cada seção, buscar as questões
    const sectionsWithQuestions: SectionToAnswer[] = []

    for (const section of sections) {
      const questions = await this.candidatesRepo.findQuestionsBySectionId(
        section.formSectionId
      )

      // 4. Para cada questão, buscar options, validations e subquestions
      const questionsComplete: QuestionToAnswer[] = []

      for (const question of questions) {
        const options = await this.candidatesRepo.findOptionsByQuestionId(
          question.questionId
        )

        const validations =
          await this.candidatesRepo.findValidationsByQuestionId(
            question.questionId
          )

        const subQuestions =
          await this.candidatesRepo.findSubQuestionsByQuestionId(
            question.questionId
          )

        // Para cada subquestão, buscar suas options e validations
        const subQuestionsComplete: SubQuestionToAnswer[] = []

        for (const subQuestion of subQuestions) {
          const subQuestionOptions =
            await this.candidatesRepo.findSubQuestionOptions(
              subQuestion.subQuestionId
            )

          const subValidations = await this.candidatesRepo.findSubValidations(
            subQuestion.subQuestionId
          )

          subQuestionsComplete.push({
            subQuestionId: subQuestion.subQuestionId,
            subQuestionPosition: subQuestion.subQuestionPosition,
            subQuestionType: subQuestion.subQuestionType,
            subQuestionStatement: subQuestion.subQuestionStatement,
            subQuestionOptions,
            subValidations
          })
        }

        // Buscar questões dependentes (questions que referenciam esta question)
        const dependentQuestions =
          await this.candidatesRepo.findDependentQuestionsByQuestionId(
            question.questionId
          )

        // Buscar seções dependentes (sections que referenciam esta question)
        const dependentSections =
          await this.candidatesRepo.findDependentSectionsByQuestionId(
            question.questionId
          )

        // Buscar answer existente ou criar uma fake sem answerId
        const existingAnswerEncrypted =
          await this.candidatesRepo.findAnswerByQuestionAndFormCandidate(
            question.questionId,
            formCandidateId
          )

        // Descriptografar answer se existir
        const existingAnswer = decryptAnswer(
          existingAnswerEncrypted,
          this.encryptionService
        )

        const answer: AnswerWithoutId = existingAnswer
          ? {
              answerValue: existingAnswer.answerValue,
              validAnswer: existingAnswer.validAnswer
            }
          : {
              answerValue: null,
              validAnswer: true
            }

        questionsComplete.push({
          questionId: question.questionId,
          questionOrder: question.questionOrder,
          questionType: question.questionType,
          questionStatement: question.questionStatement,
          questionDescription: question.questionDescription,
          options,
          validations,
          subQuestions: subQuestionsComplete,
          dependentQuestions,
          dependentSections,
          answer
        })
      }

      sectionsWithQuestions.push({
        formSectionId: section.formSectionId,
        formSectionName: section.formSectionName,
        formSectionOrder: section.formSectionOrder,
        questions: questionsComplete
      })
    }

    return {
      sFormId: form.sFormId,
      sFormName: form.sFormName,
      sections: sectionsWithQuestions
    }
  }

  /**
   * Envia email para candidato do tipo "candidate"
   * Método unificado usado tanto no primeiro envio quanto no reenvio
   */
  private async sendCandidateFormEmail(
    candidateName: string,
    candidateEmail: string,
    accessCode: string,
    frontendUrl: string,
    emailTemplate: (name: string, link: string, code: string) => string,
    emailType: 'primeiro acesso' | 'reenvio'
  ): Promise<void> {
    try {
      const { recipientName, recipientEmail, html } = prepareCandidateEmailData(
        candidateName,
        candidateEmail,
        accessCode,
        frontendUrl,
        this.encryptionService,
        emailTemplate
      )

      await this.sendPulseEmailService.sendEmail(
        recipientEmail,
        recipientName,
        html
      )

      this.loggger.info(
        `Email de ${emailType} enviado para ${recipientName} (${recipientEmail})`
      )
    } catch (error) {
      this.loggger.error(`Erro ao enviar email de ${emailType}:`, error.stack)
    }
  }

  /**
   * Processa a inserção de candidatos verificando duplicatas
   * Envia email com resumo do processo
   */
  private async processCandidatesInsertion(allCandidates: CreateCandidate[]) {
    try {
      // Agrupar candidatos por processo para verificar duplicatas
      const candidatesByProcess = new Map<number, CreateCandidate[]>()
      allCandidates.forEach((candidate) => {
        if (!candidatesByProcess.has(candidate.processId)) {
          candidatesByProcess.set(candidate.processId, [])
        }
        candidatesByProcess.get(candidate.processId)!.push(candidate)
      })

      const candidatesToInsert: CreateCandidate[] = []
      let duplicatesCount = 0

      // Verificar duplicatas para cada processo
      for (const [processId, candidates] of candidatesByProcess) {
        const uniqueDocuments: string[] = candidates.map(
          (c) => c.candidateUniqueDocument
        )
        const existingDocuments: string[] =
          await this.candidatesRepo.findExistingCandidatesByProcessAndDocument(
            processId,
            uniqueDocuments
          )

        // Filtrar apenas os candidatos que não existem
        const newCandidates: CreateCandidate[] = candidates.filter(
          (candidate) =>
            !existingDocuments.includes(candidate.candidateUniqueDocument)
        )

        duplicatesCount += candidates.length - newCandidates.length
        candidatesToInsert.push(...newCandidates)
      }

      // Inserir novos candidatos
      if (candidatesToInsert.length > 0) {
        await this.candidatesRepo.insertCandidatesInBatch(candidatesToInsert)
        this.loggger.info(
          `\n=== Total de ${candidatesToInsert.length} candidatos inseridos com sucesso ===`
        )
      }

      if (duplicatesCount > 0) {
        this.loggger.info(
          `\n=== ${duplicatesCount} candidatos duplicados foram ignorados ===`
        )
      }

      // Enviar email com resumo
      await this.sendImportSummaryEmail(
        allCandidates.length,
        duplicatesCount,
        candidatesToInsert.length
      )
    } catch (error) {
      this.loggger.error('Erro ao inserir candidatos em batch:', error.stack)
    }
  }

  /**
   * Envia email com resumo da importação de candidatos
   */
  private async sendImportSummaryEmail(
    totalFound: number,
    totalDuplicated: number,
    totalInserted: number
  ) {
    try {
      const html = getImportSummaryEmailTemplate(
        totalFound,
        totalDuplicated,
        totalInserted
      )

      await this.sendPulseEmailService.sendEmail(
        'werterpires23@hotmail.com',
        'Werter Pires',
        html
      )

      this.loggger.info('Email de resumo enviado com sucesso')
    } catch (error) {
      this.loggger.error('Erro ao enviar email de resumo:', error.stack)
    }
  }

  /**
   * Converte resposta da API em array de candidatos
   * Utiliza helper para transformação
   */
  private parseApiResponseToCandidates(
    apiData: any[],
    processId: number
  ): CreateCandidate[] {
    const candidates: CreateCandidate[] = []

    for (const item of apiData) {
      const candidate = transformApiItemToCandidate(
        item,
        processId,
        this.encryptionService
      )

      if (candidate) {
        candidates.push(candidate)
      }
    }

    return candidates
  }

  /**
   * Envia emails apenas para formulários do tipo "candidate"
   * Otimizado com uma única query para buscar todos os dados necessários
   */
  private async sendEmailsForCandidateForms(formsCandidatesIds: number[]) {
    const frontendUrl = getFrontendUrl()

    // Buscar todos os dados de uma vez (query otimizada com JOIN)
    const formsCandidatesData: FormCandidateWithDetails[] =
      await this.candidatesRepo.findCandidatesWithFormsCandidatesByIds(
        formsCandidatesIds
      )

    for (const formCandidateData of formsCandidatesData) {
      // Processar apenas formulários do tipo "candidate"
      if (formCandidateData.sFormType === 'candidate') {
        await this.sendCandidateFormEmail(
          formCandidateData.candidateName,
          formCandidateData.candidateEmail,
          formCandidateData.formCandidateAccessCode,
          frontendUrl,
          getCandidateFormAccessEmailTemplate,
          'primeiro acesso'
        )

        // Atualizar status para MAILED após envio bem-sucedido
        await this.candidatesRepo.updateFormCandidateStatus(
          formCandidateData.candidateId,
          formCandidateData.sFormId,
          FormCandidateStatus.MAILED
        )

        this.loggger.info('Status atualizado para MAILED')
      }
      // Formulários "normal" e "ministerial" serão processados em outro cron
      // quando a tabela de respostas estiver disponível
    }
  }
}
