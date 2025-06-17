import { Module } from '@nestjs/common';
import { FormSectionsService } from './form-sections.service';
import { FormSectionsController } from './form-sections.controller';

@Module({
  controllers: [FormSectionsController],
  providers: [FormSectionsService],
})
export class FormSectionsModule {}
