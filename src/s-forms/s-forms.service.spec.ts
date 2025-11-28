import { Test, TestingModule } from '@nestjs/testing';
import { SFormsService } from './s-forms.service';

describe('SFormsService', () => {
  let service: SFormsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SFormsService],
    }).compile();

    service = module.get<SFormsService>(SFormsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
