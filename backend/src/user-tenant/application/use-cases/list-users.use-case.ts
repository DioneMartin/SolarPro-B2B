import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { UserOutput } from '../dto/user.output';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  async execute(tenantId: string): Promise<UserOutput[]> {
    const users = await this.userRepo.findAllByTenant(tenantId);
    return users.map((u) => ({
      id: u.id,
      email: u.email.value,
      fullName: u.fullName,
      role: u.role,
      status: u.status,
      tenantId: u.tenantId,
      createdAt: u.createdAt,
    }));
  }
}
