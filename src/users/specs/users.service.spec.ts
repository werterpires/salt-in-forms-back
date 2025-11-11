import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from '../users.service'
import { UsersRepo } from '../users.repo'
import { EncryptionService } from 'src/shared/utils-module/encryption/encryption.service'
import { SendPulseEmailService } from 'src/shared/utils-module/email-sender/sendpulse-email.service'

describe('UsersService', () => {
  let service: UsersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepo, useValue: {} },
        {
          provide: EncryptionService,
          useValue: { decrypt: (v: string) => v }
        },
        {
          provide: SendPulseEmailService,
          useValue: { sendEmail: jest.fn() }
        }
      ]
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
