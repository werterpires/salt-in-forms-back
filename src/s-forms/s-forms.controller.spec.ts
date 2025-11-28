import { Test, TestingModule } from '@nestjs/testing';
import { SFormsController } from './s-forms.controller';
import { SFormsService } from './s-forms.service';

describe('SFormsController', () => {
  let controller: SFormsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SFormsController],
      providers: [SFormsService],
    }).compile();

    controller = module.get<SFormsController>(SFormsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
