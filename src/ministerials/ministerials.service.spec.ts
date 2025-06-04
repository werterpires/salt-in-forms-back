import { Test, TestingModule } from '@nestjs/testing';
import { MinisterialsService } from './ministerials.service';

describe('MinisterialsService', () => {
  let service: MinisterialsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MinisterialsService],
    }).compile();

    service = module.get<MinisterialsService>(MinisterialsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
