import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { JwtPayload } from './jwt-payload';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
    const req = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    return req.user;
  },
);

export const CurrentTenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    return req.user?.tenantId;
  },
);
