import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { TenantContext } from './tenant-context';

interface AuthedRequest extends Request {
  user?: { sub: string; tenantId: string; role: string };
}

/**
 * Reads the authenticated user (attached by the JWT guard) and
 * activates a TenantContext scope for the duration of the request.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly ctx: TenantContext) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const user = req.user;

    if (!user) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      this.ctx.run(
        { tenantId: user.tenantId, userId: user.sub, role: user.role },
        () => {
          next.handle().subscribe({
            next: (v) => subscriber.next(v),
            error: (e) => subscriber.error(e),
            complete: () => subscriber.complete(),
          });
        },
      );
    });
  }
}
