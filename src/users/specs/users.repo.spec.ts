import { Test, TestingModule } from '@nestjs/testing'
import { UsersRepo } from '../users.repo'
import { getConnectionToken } from 'nest-knexjs'
import { createKnexMock } from 'src/shared/knexMock'
import * as usersExample from '../users.examples'

describe('UsersService', () => {
  let service: UsersRepo
  let knexMock: ReturnType<typeof createKnexMock>

  beforeEach(async () => {
    knexMock = createKnexMock()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepo,
        {
          provide: getConnectionToken('knexx'),
          useValue: knexMock.knexMock
        }
      ]
    }).compile()

    service = module.get<UsersRepo>(UsersRepo)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findUserByEmail', () => {
    it('should find a user by email', async () => {
      knexMock.first.mockResolvedValueOnce(usersExample.user)

      const user = await service.findUserByEmailForLogin('o6lXj@example.com')

      expect(user).toBeDefined()
      expect(user).toEqual(usersExample.user)
    })
  })
})
