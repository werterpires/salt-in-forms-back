import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestionDto } from './create-question.dto';

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}
import { IsNumber, IsOptional, Length, IsArray, IsString } from 'class-validator'

export class UpdateQuestionDto {
  @IsNumber({}, { message: '#O ID da pergunta deve ser numérico.' })
  questionId: number

  @Length(3, 200, {
    message: '#O nome da pergunta deve ter no mínimo 3 e no máximo 200 caracteres'
  })
  questionName: string

  @IsNumber({}, { message: '#A regra de exibição deve ser numérica.' })
  questionDisplayRule: number

  @IsOptional()
  @IsNumber({}, { message: '#O link da seção deve ser numérico.' })
  formSectionDisplayLink?: number

  @IsOptional()
  @IsNumber({}, { message: '#O link da pergunta deve ser numérico.' })
  questionDisplayLink?: number

  @IsOptional()
  @IsNumber({}, { message: '#A regra de exibição da resposta deve ser numérica.' })
  answerDisplayRule?: number

  @IsOptional()
  @IsArray({ message: '#O valor de exibição da resposta deve ser um array.' })
  @IsString({ each: true, message: '#Cada valor deve ser uma string.' })
  answerDisplayValue?: string[]
}
