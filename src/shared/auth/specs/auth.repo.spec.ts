import { Test, TestingModule } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { createKnexMock } from 'src/shared/knexMock'
import { AuthRepo } from '../auth.repo'
import * as authExample from '../auth.examples'

describe('UsersService', () => {
  let service: AuthRepo
  let knexMock: ReturnType<typeof createKnexMock>

  beforeEach(async () => {
    knexMock = createKnexMock()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRepo,
        {
          provide: getConnectionToken('knexx'),
          useValue: knexMock.knexMock
        }
      ]
    }).compile()

    service = module.get<AuthRepo>(AuthRepo)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findUserByEmail', () => {
    it('should find a user by email', async () => {
      knexMock.first.mockResolvedValueOnce(authExample.user)

      const user = await service.findUserByEmailForLogin('o6lXj@example.com')

      expect(user).toBeDefined()
      expect(user).toEqual(authExample.user)
    })
  })
})
