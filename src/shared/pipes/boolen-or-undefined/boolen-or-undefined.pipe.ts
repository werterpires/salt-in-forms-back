import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform
} from '@nestjs/common'

@Injectable()
export class BoolenOrUndefinedPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value === 'true' || value === true) {
      return true
    }

    if (value === 'false' || value === false) {
      return false
    }

    if (value === undefined || value === null || value === '') {
      return undefined
    }

    throw new BadRequestException(
      `O valor para "${metadata.data}" deve ser 'true', 'false' ou estar ausente.`
    )
  }
}
