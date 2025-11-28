import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsAreasService } from './questions-areas.service';

describe('QuestionsAreasService', () => {
  let service: QuestionsAreasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionsAreasService],
    }).compile();

    service = module.get<QuestionsAreasService>(QuestionsAreasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
