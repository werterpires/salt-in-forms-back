import { Test, TestingModule } from '@nestjs/testing';
import { MinisterialsController } from './ministerials.controller';
import { MinisterialsService } from './ministerials.service';

describe('MinisterialsController', () => {
  let controller: MinisterialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MinisterialsController],
      providers: [MinisterialsService],
    }).compile();

    controller = module.get<MinisterialsController>(MinisterialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
