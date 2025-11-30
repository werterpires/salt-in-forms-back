import {
  Injectable,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common'
import { RatesRepo } from './rates.repo'
import { CandidatesRepo } from '../candidates/candidates.repo'
import { EncryptionService } from '../shared/utils-module/encryption/encryption.service'
import { InterviewData, InterviewForm, InterviewAnswer } from './types'
import { Candidate } from '../candidates/types'

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
    interviewUserId: number
  ): Promise<InterviewData> {
    // 1. Verificar se o candidato pertence ao entrevistador
    const isAssigned = await this.ratesRepo.isCandidateAssignedToInterviewer(
      candidateId,
      interviewUserId
    )

    if (!isAssigned) {
      throw new ForbiddenException(
        '#Você não tem permissão para visualizar dados deste candidato'
      )
    }

    // 2. Buscar dados do candidato (criptografados)
    const candidateEncrypted =
      await this.candidatesRepo.findCandidateById(candidateId)

    if (!candidateEncrypted) {
      throw new BadRequestException('#Candidato não encontrado')
    }

    // 3. Descriptografar dados do candidato
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

    // 4. Buscar todos os FormsCandidates do candidato
    const formsCandidates =
      await this.ratesRepo.findFormsCandidatesByCandidateId(candidateId)

    // 5. Buscar todas as respostas válidas com detalhes (uma única query otimizada)
    const answersWithDetails =
      await this.ratesRepo.findAnswersWithDetailsForCandidate(candidateId)

    // 6. Agrupar respostas por formulário
    const formAnswersMap = new Map<number, any[]>()

    for (const answer of answersWithDetails) {
      if (!formAnswersMap.has(answer.sFormId)) {
        formAnswersMap.set(answer.sFormId, [])
      }
      formAnswersMap.get(answer.sFormId)!.push(answer)
    }

    // 7. Montar array de InterviewForm
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

    // 8. Retornar InterviewData completo
    return {
      candidate,
      interviewForms
    }
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
}
