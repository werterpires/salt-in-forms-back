import { Test, TestingModule } from '@nestjs/testing'
import { UsersController } from '../users.controller'
import { UsersService } from '../users.service'
import { UsersRepo } from '../users.repo'
import { EncryptionService } from 'src/shared/utils-module/encryption/encryption.service'
import { SendPulseEmailService } from 'src/shared/utils-module/email-sender/sendpulse-email.service'

describe('UsersController', () => {
  let controller: UsersController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
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

    controller = module.get<UsersController>(UsersController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
