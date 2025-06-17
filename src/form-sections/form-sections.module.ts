
import { Module } from '@nestjs/common'
import { FormSectionsService } from './form-sections.service'
import { FormSectionsController } from './form-sections.controller'
import { FormSectionsRepo } from './form-sections.repo'

const services = [FormSectionsService, FormSectionsRepo]

@Module({
  controllers: [FormSectionsController],
  providers: services
})
export class FormSectionsModule {}
