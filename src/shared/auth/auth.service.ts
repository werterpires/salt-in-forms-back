import {
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { User } from 'src/users/types'
import { AuthRepo } from './auth.repo'
import * as bcrypt from 'bcrypt'
import { CustomErrors } from '../custom-error-handler/erros.enum'
import { UserPayload, UserToken, ValidateUser } from './types'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepo,
    private readonly jwtService: JwtService
  ) {}
  async validateUser(email: string, password: string): Promise<User> {
    const user: User | undefined =
      await this.authRepo.findUserByEmailForLogin(email)

    if (user && user.userId > 0) {
      const isPasswordValid = await bcrypt.compare(password, user.userPassword)

      if (!isPasswordValid) {
        throw new UnauthorizedException(CustomErrors.UNAUTHORIZED_EXCEPTION)
      }

      if (!user.userActive) {
        throw new ForbiddenException(CustomErrors.INACTIVE_USER)
      }

      return {
        ...user,
        userPassword: ''
      }
    }
    throw new Error(CustomErrors.UNAUTHORIZED_EXCEPTION)
  }

  login(user: ValidateUser): UserToken {
    const payload: UserPayload = {
      sub: user.userId,
      userEmail: user.userEmail,
      userName: user.userName,
      userActive: user.userActive
    }
    const jwtToken = this.jwtService.sign(payload)
    return { access_token: jwtToken }
  }
}
