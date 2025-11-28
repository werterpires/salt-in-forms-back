import { SetMetadata } from '@nestjs/common'
import { ERoles } from 'src/constants/roles.const'

export const Roles = (...roles: ERoles[]) => SetMetadata('roles', roles)
