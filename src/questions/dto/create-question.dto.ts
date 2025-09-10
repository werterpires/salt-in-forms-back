import {
  IsNumber,
  IsOptional,
  Length,
  Min,
  IsArray,
  IsString,
  ValidateNested,
  IsDefined,
  ValidateIf
} from 'class-validator'
import { Type } from 'class-transformer'
import { ValidationDto } from './update-question.dto'
import { QuestionOptionDto, SubQuestionOptionDto } from './optionsDto'
import { SubValidationDto } from './validationDto'

export class CreateQuestionDto {
  @IsNumber({}, { message: '#O ID da seção deve ser numérico.' })
  formSectionId: number

  @IsNumber({}, { message: '#O ID da área da pergunta deve ser numérico.' })
  questionAreaId: number

  @IsNumber({}, { message: '#A ordem da pergunta deve ser numérica.' })
  @Min(1, { message: '#A ordem da pergunta deve ser maior que 0.' })
  questionOrder: number

  @IsNumber({}, { message: '#O tipo da pergunta deve ser numérico.' })
  questionType: number

  @Length(3, 255, {
    message:
      '#O enunciado da pergunta deve ter no mínimo 3 e no máximo 255 caracteres'
  })
  questionStatement: string

  @Length(0, 255, {
    message: '#A descrição da pergunta deve ter no máximo 255 caracteres'
  })
  questionDescription: string

  @IsNumber({}, { message: '#A regra de exibição deve ser numérica.' })
  questionDisplayRule: number

  @IsOptional()
  @IsNumber({}, { message: '#O link da seção deve ser numérico.' })
  formSectionDisplayLink?: number

  @IsOptional()
  @IsNumber({}, { message: '#O link da pergunta deve ser numérico.' })
  questionDisplayLink?: number

  @IsOptional()
  @IsNumber(
    {},
    { message: '#A regra de exibição da resposta deve ser numérica.' }
  )
  answerDisplayRule?: number

  @IsOptional()
  @IsArray({ message: '#As validações devem ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => ValidationDto)
  validations?: ValidationDto[]

  @IsOptional()
  @IsArray({ message: '#O valor de exibição da resposta deve ser um array.' })
  @IsNumber(undefined, {
    each: true,
    message: '#Cada valor deve ser numérico.'
  })
  answerDisplayValue?: string[]

  @IsOptional()
  @IsArray({ message: '#As opções da pergunta devem ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  questionOptions?: QuestionOptionDto[]

  @IsOptional()
  @IsArray({ message: '#As subquestões devem ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => CreateSubQuestionDto)
  subQuestions?: CreateSubQuestionDto[]
}

export class CreateSubQuestionDto {
  @IsNumber({}, { message: '#O ID da pergunta deve ser numérico.' })
  questionId: number

  @IsNumber({}, { message: '#A ordem da pergunta deve ser numérica.' })
  @Min(1, { message: '#A ordem da pergunta deve ser maior que 0.' })
  subQuestionPosition: number

  @IsNumber({}, { message: '#O tipo da pergunta deve ser numérico.' })
  subQuestionType: number

  @Length(3, 255, {
    message:
      '#O enunciado da pergunta deve ter no mínimo 3 e no.maxcdn 255 caracteres'
  })
  subQuestionStatement: string

  @IsOptional()
  @IsArray({ message: '#As opções da pergunta devem ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => SubQuestionOptionDto)
  subQuestionOptions?: SubQuestionOptionDto[]

  @IsOptional()
  @IsArray({ message: '#As validações devem ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => SubValidationDto)
  subValidations?: SubValidationDto[]
}
