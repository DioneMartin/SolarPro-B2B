import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/errors/app.error';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { TENANT_REPOSITORY } from '../../domain/repositories/tenant.repository';
import type { TenantRepository } from '../../domain/repositories/tenant.repository';
import type { UserOutput } from '../dto/user.output';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepo: TenantRepository,
  ) {}

  async execute(userId: string, tenantId: string): Promise<UserOutput> {
    const user = await this.userRepo.findById(userId, tenantId);
    if (!user) throw new NotFoundError('User', userId);

    const tenant = await this.tenantRepo.findById(tenantId);

    return {
      id: user.id,
      email: user.email.value,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      tenantId: user.tenantId,
      tenantName: tenant?.name,
      createdAt: user.createdAt,
    };
  }
}
