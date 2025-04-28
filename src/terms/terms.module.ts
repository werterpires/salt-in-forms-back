import { Module } from '@nestjs/common'
import { TermsService } from './terms.service'
import { TermsController } from './terms.controller'
import { TermsRepo } from './terms.repo'

const services = [TermsService, TermsRepo]

@Module({
  controllers: [TermsController],
  providers: services
})
export class TermsModule {}
