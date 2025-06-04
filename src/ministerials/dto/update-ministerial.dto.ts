import { PartialType } from '@nestjs/mapped-types'
import { CreateMinisterialDto } from './create-ministerial.dto'

export class UpdateMinisterialDto extends PartialType(CreateMinisterialDto) {}
