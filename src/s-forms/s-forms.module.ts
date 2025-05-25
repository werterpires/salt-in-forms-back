import { Module } from '@nestjs/common'
import { SFormsService } from './s-forms.service'
import { SFormsController } from './s-forms.controller'
import { SFormsRepo } from './s-forms.repo'

const services = [SFormsService, SFormsRepo]

@Module({
  controllers: [SFormsController],
  providers: services
})
export class SFormsModule {}
