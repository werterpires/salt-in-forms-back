import { Test, TestingModule } from '@nestjs/testing';
import { FormSectionsService } from './form-sections.service';

describe('FormSectionsService', () => {
  let service: FormSectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormSectionsService],
    }).compile();

    service = module.get<FormSectionsService>(FormSectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
