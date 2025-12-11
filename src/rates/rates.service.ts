import {
  Injectable,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common'
import { RatesRepo } from './rates.repo'
import { CandidatesRepo } from '../candidates/candidates.repo'
import { EncryptionService } from '../shared/utils-module/encryption/encryption.service'
import { InterviewData, InterviewForm, InterviewAnswer, Rate } from './types'
import { Candidate } from '../candidates/types'
import { ValidateUser } from 'src/shared/auth/types'
import { ERoles } from 'src/constants/roles.const'

@Injectable()
export class RatesService {
  constructor(
    private readonly ratesRepo: RatesRepo,
    private readonly candidatesRepo: CandidatesRepo,
    private readonly encryptionService: EncryptionService
  ) {}

  /**
   * Busca dados completos de entrevista para um candidato
   * Verifica se o entrevistador atual é o responsável pelo candidato
   *
   * @param candidateId - ID do candidato
   * @param interviewUserId - ID do entrevistador (do token JWT)
   * @returns InterviewData com candidato e formulários respondidos
   */
  async getInterviewDataForCandidate(
    candidateId: number,
    user: ValidateUser
  ): Promise<InterviewData> {
    // 1. Verificar se o candidato pertence ao entrevistador
    const isAssigned = await this.ratesRepo.isCandidateAssignedToInterviewer(
      candidateId,
      user.userId
    )

    if (!isAssigned) {
      throw new ForbiddenException(
        '#Você não tem permissão para visualizar dados deste candidato'
      )
    }

    // Retorna dados completos da entrevista
    return await this.getFullInterviewData(candidateId, user)
  }

  /**
   * Busca dados completos de entrevista para um candidato (ADMIN/SEC)
   * Não realiza validação de vínculo com entrevistador
   */
  async getInterviewDataForCandidateAsAdmin(
    candidateId: number,
    user: ValidateUser
  ): Promise<InterviewData> {
    return await this.getFullInterviewData(candidateId, user)
  }

  /**
   * Método interno que monta os dados completos da entrevista
   */
  private async getFullInterviewData(
    candidateId: number,
    user: ValidateUser
  ): Promise<InterviewData> {
    // Buscar dados do candidato (criptografados)
    const candidateEncrypted =
      await this.candidatesRepo.findCandidateById(candidateId)

    if (!candidateEncrypted) {
      throw new BadRequestException('#Candidato não encontrado')
    }

    // Descriptografar dados do candidato
    const candidate: Candidate = {
      candidateId: candidateEncrypted.candidateId,
      processId: candidateEncrypted.processId,
      candidateName: this.encryptionService.decrypt(
        candidateEncrypted.candidateName
      ),
      candidateUniqueDocument: candidateEncrypted.candidateUniqueDocument,
      candidateDocumentType: candidateEncrypted.candidateDocumentType,
      candidateEmail: this.encryptionService.decrypt(
        candidateEncrypted.candidateEmail
      ),
      candidatePhone: this.encryptionService.decrypt(
        candidateEncrypted.candidatePhone
      ),
      candidateBirthdate: candidateEncrypted.candidateBirthdate,
      candidateForeigner: candidateEncrypted.candidateForeigner,
      candidateAddress: this.encryptionService.decrypt(
        candidateEncrypted.candidateAddress
      ),
      candidateAddressNumber: this.encryptionService.decrypt(
        candidateEncrypted.candidateAddressNumber
      ),
      candidateDistrict: this.encryptionService.decrypt(
        candidateEncrypted.candidateDistrict
      ),
      candidateCity: this.encryptionService.decrypt(
        candidateEncrypted.candidateCity
      ),
      candidateState: this.encryptionService.decrypt(
        candidateEncrypted.candidateState
      ),
      candidateZipCode: this.encryptionService.decrypt(
        candidateEncrypted.candidateZipCode
      ),
      candidateCountry: this.encryptionService.decrypt(
        candidateEncrypted.candidateCountry
      ),
      interviewUserId: candidateEncrypted.interviewUserId,
      approved: candidateEncrypted.approved
    }

    const userRoles = user.userRoles

    if (
      !userRoles.includes(ERoles.ADMIN) &&
      !userRoles.includes(ERoles.INTERV)
    ) {
      return { candidate, interviewForms: [] }
    }

    // Buscar todos os FormsCandidates do candidato
    const formsCandidates =
      await this.ratesRepo.findFormsCandidatesByCandidateId(candidateId)

    // Buscar todas as respostas válidas com detalhes (uma única query otimizada)
    const answersWithDetails =
      await this.ratesRepo.findAnswersWithDetailsForCandidate(candidateId)

    // Agrupar respostas por formulário
    const formAnswersMap = new Map<number, any[]>()
    for (const answer of answersWithDetails) {
      if (!formAnswersMap.has(answer.sFormId)) {
        formAnswersMap.set(answer.sFormId, [])
      }
      formAnswersMap.get(answer.sFormId)!.push(answer)
    }

    // Montar array de InterviewForm
    const interviewForms: InterviewForm[] = formsCandidates.map(
      (formCandidate) => {
        const answersForForm = formAnswersMap.get(formCandidate.sFormId) || []

        const interviewAnswers: InterviewAnswer[] = answersForForm.map(
          (answer) => ({
            questionId: answer.questionId,
            questionOrder: answer.questionOrder,
            questionStatement: answer.questionStatement,
            questionAreaId: answer.questionAreaId,
            questionAreaName: answer.questionAreaName,
            questionAreaDescription: answer.questionAreaDescription,
            answerId: answer.answerId,
            answerValue: answer.answerValue
              ? this.encryptionService.decrypt(answer.answerValue)
              : '',
            answerComment: answer.answerComment
          })
        )

        return {
          sFormId: formCandidate.sFormId,
          sFormName: formCandidate.sFormName,
          interviewAnswers
        }
      }
    )

    // Retornar InterviewData completo
    return { candidate, interviewForms }
  }

  /**
   * Atualiza o comentário de uma resposta
   * Verifica se a resposta pertence a um candidato do entrevistador atual
   *
   * @param answerId - ID da resposta
   * @param answerComment - Comentário a ser salvo
   * @param interviewUserId - ID do entrevistador (do token JWT)
   */
  async updateAnswerComment(
    answerId: number,
    answerComment: string,
    interviewUserId: number
  ): Promise<void> {
    // Verificar se a resposta pertence a um candidato do entrevistador
    const isOwned = await this.ratesRepo.isAnswerOwnedByInterviewer(
      answerId,
      interviewUserId
    )

    if (!isOwned) {
      throw new ForbiddenException(
        '#Você não tem permissão para comentar esta resposta'
      )
    }

    // Atualizar o comentário
    await this.ratesRepo.updateAnswerComment(answerId, answerComment)
  }

  /**
   * Cria um novo rate para um candidato em uma área de questão
   * Verifica se o entrevistador é responsável pelo candidato
   * Verifica se a data final do processo não passou
   *
   * @param candidateId - ID do candidato
   * @param questionAreaId - ID da área de questão
   * @param rateValue - Nota (opcional)
   * @param rateComment - Comentário (opcional)
   * @param interviewUserId - ID do entrevistador (do token JWT)
   * @returns ID do rate criado
   */
  async createRate(
    candidateId: number,
    questionAreaId: number,
    rateValue: number | undefined,
    rateComment: string | undefined,
    interviewUserId: number
  ): Promise<number> {
    // 1. Verificar se o candidato pertence ao entrevistador
    const isAssigned = await this.ratesRepo.isCandidateAssignedToInterviewer(
      candidateId,
      interviewUserId
    )

    if (!isAssigned) {
      throw new ForbiddenException(
        '#Você não tem permissão para avaliar este candidato'
      )
    }

    // 2. Verificar se a data final do processo não passou
    const processEndDate =
      await this.ratesRepo.getProcessEndDateByCandidate(candidateId)

    if (!processEndDate) {
      throw new BadRequestException('#Processo não encontrado para o candidato')
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endDate = new Date(processEndDate)
    endDate.setHours(0, 0, 0, 0)

    if (today > endDate) {
      throw new BadRequestException(
        '#O prazo final do processo já passou. Não é possível criar avaliações.'
      )
    }

    // 3. Verificar se já existe um rate para este candidato/entrevistador/área
    const existingRateId = await this.ratesRepo.findExistingRate(
      candidateId,
      interviewUserId,
      questionAreaId
    )

    if (existingRateId) {
      throw new BadRequestException(
        '#Já existe uma avaliação para este candidato nesta área. Use o endpoint de edição.'
      )
    }

    // 4. Criar o rate
    const rateId = await this.ratesRepo.createRate({
      candidateId,
      interviewerId: interviewUserId,
      questionAreaId,
      rateValue,
      rateComment
    })

    return rateId
  }

  /**
   * Atualiza um rate existente (apenas nota e comentário)
   * Verifica se o rate pertence ao entrevistador atual
   * Verifica se a data final do processo não passou
   *
   * @param rateId - ID do rate
   * @param rateValue - Nova nota (opcional)
   * @param rateComment - Novo comentário (opcional)
   * @param interviewUserId - ID do entrevistador (do token JWT)
   */
  async updateRate(
    rateId: number,
    rateValue: number | undefined,
    rateComment: string | undefined,
    interviewUserId: number
  ): Promise<void> {
    // 1. Verificar se o rate pertence ao entrevistador
    const isOwned = await this.ratesRepo.isRateOwnedByInterviewer(
      rateId,
      interviewUserId
    )

    if (!isOwned) {
      throw new ForbiddenException(
        '#Você não tem permissão para editar esta avaliação'
      )
    }

    // 2. Buscar candidateId do rate para verificar a data do processo
    const rate = await this.ratesRepo.getRateDetails(rateId)

    if (!rate) {
      throw new BadRequestException('#Avaliação não encontrada')
    }

    // 3. Verificar se a data final do processo não passou
    const processEndDate = await this.ratesRepo.getProcessEndDateByCandidate(
      rate.candidateId
    )

    if (!processEndDate) {
      throw new BadRequestException('#Processo não encontrado para o candidato')
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endDate = new Date(processEndDate)
    endDate.setHours(0, 0, 0, 0)

    if (today > endDate) {
      throw new BadRequestException(
        '#O prazo final do processo já passou. Não é possível editar avaliações.'
      )
    }

    // 4. Atualizar o rate
    await this.ratesRepo.updateRate(rateId, {
      rateValue,
      rateComment
    })
  }

  /**
   * Busca todos os rates de um entrevistador para um candidato específico
   * Verifica se o candidato pertence ao entrevistador atual
   *
   * @param candidateId - ID do candidato
   * @param interviewUserId - ID do entrevistador (do token JWT)
   * @returns Array de rates
   */
  async getRatesForCandidate(
    candidateId: number,
    interviewUserId: number
  ): Promise<Rate[]> {
    // Verificar se o candidato pertence ao entrevistador
    const isAssigned = await this.ratesRepo.isCandidateAssignedToInterviewer(
      candidateId,
      interviewUserId
    )

    if (!isAssigned) {
      throw new ForbiddenException(
        '#Você não tem permissão para visualizar avaliações deste candidato'
      )
    }

    // Buscar os rates
    return await this.ratesRepo.findRatesByInterviewerAndCandidate(
      candidateId,
      interviewUserId
    )
  }
}
