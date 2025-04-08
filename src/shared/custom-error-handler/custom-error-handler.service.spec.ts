import { Test, TestingModule } from '@nestjs/testing'
import { CustomErrorHandlerService } from './custom-error-handler.service'

describe('CustomErrorHandlerService', () => {
  let service: CustomErrorHandlerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomErrorHandlerService]
    }).compile()

    service = module.get<CustomErrorHandlerService>(CustomErrorHandlerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
