import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/errors/app.error';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { UserOutput } from '../dto/user.output';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  async execute(userId: string, tenantId: string): Promise<UserOutput> {
    const user = await this.userRepo.findById(userId, tenantId);
    if (!user) throw new NotFoundError('User', userId);

    return {
      id: user.id,
      email: user.email.value,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      tenantId: user.tenantId,
      createdAt: user.createdAt,
    };
  }
}
