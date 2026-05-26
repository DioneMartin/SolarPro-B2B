import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { UnauthorizedError } from '../errors';

export interface TenantScope {
  tenantId: string;
  userId: string;
  role: string;
}

/**
 * Per-request scope carried via AsyncLocalStorage so repositories
 * and use cases can read the current tenant without prop-drilling.
 */
@Injectable()
export class TenantContext {
  private readonly als = new AsyncLocalStorage<TenantScope>();

  run<T>(scope: TenantScope, fn: () => T): T {
    return this.als.run(scope, fn);
  }

  current(): TenantScope | undefined {
    return this.als.getStore();
  }

  require(): TenantScope {
    const scope = this.als.getStore();
    if (!scope) {
      throw new UnauthorizedError('No tenant scope on this request');
    }
    return scope;
  }

  requireTenantId(): string {
    return this.require().tenantId;
  }
}
