import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsAreasController } from './questions-areas.controller';
import { QuestionsAreasService } from './questions-areas.service';

describe('QuestionsAreasController', () => {
  let controller: QuestionsAreasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsAreasController],
      providers: [QuestionsAreasService],
    }).compile();

    controller = module.get<QuestionsAreasController>(QuestionsAreasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
