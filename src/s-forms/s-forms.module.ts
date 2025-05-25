import { Module } from '@nestjs/common';
import { SFormsService } from './s-forms.service';
import { SFormsController } from './s-forms.controller';

@Module({
  controllers: [SFormsController],
  providers: [SFormsService],
})
export class SFormsModule {}
