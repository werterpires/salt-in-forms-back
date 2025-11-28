import { Test, TestingModule } from '@nestjs/testing'
import { UsersRepo } from '../users.repo'

describe('UsersService', () => {
  let service: UsersRepo

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersRepo]
    }).compile()

    service = module.get<UsersRepo>(UsersRepo)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
