import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenError } from '../errors';
import { JwtPayload } from './jwt-payload';
import { Role } from './role.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = req.user;

    if (!user) {
      throw new ForbiddenError('No authenticated user');
    }
    // TENANT_ADMIN is the company owner — always has full access
    if (user.role === Role.TENANT_ADMIN) {
      return true;
    }
    if (!required.includes(user.role)) {
      throw new ForbiddenError(
        `Role ${user.role} is not permitted (requires: ${required.join(', ')})`,
      );
    }
    return true;
  }
}
