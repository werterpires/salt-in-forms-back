import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ERoles } from 'src/constants/roles.const'
import { AuthRequest } from 'src/shared/auth/types'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ERoles[]>('roles', [
      context.getHandler(),
      context.getClass()
    ])

    if (!requiredRoles) {
      return true
    }

    const request = context.switchToHttp().getRequest<AuthRequest>()
    const user = request.user

    const userRoles: number[] = []
    const matchUserRoles: number[] = []

    user.userRoles.forEach((role) => {
      userRoles.push(role)
    })

    requiredRoles.forEach((role) => {
      if (userRoles.includes(role)) {
        matchUserRoles.push(role)
      }
    })

    if (matchUserRoles.length < 1) {
      throw new ForbiddenException(
        '#Você não tem um papel válido para acessar esse recurso'
      )
    }

    const active = user.userActive

    if (!active) {
      throw new ForbiddenException(
        '#O usuário precisa estar ativo para acessar esse recurso'
      )
    }

    return true
  }
}
