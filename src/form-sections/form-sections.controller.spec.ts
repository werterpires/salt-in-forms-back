import { Test, TestingModule } from '@nestjs/testing'
import { FormSectionsController } from './form-sections.controller'
import { FormSectionsService } from './form-sections.service'

describe('FormSectionsController', () => {
  let controller: FormSectionsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormSectionsController],
      providers: [FormSectionsService]
    }).compile()

    controller = module.get<FormSectionsController>(FormSectionsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
