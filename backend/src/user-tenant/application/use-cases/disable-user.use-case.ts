import { Inject, Injectable } from '@nestjs/common';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';
import { NotFoundError } from '../../../shared/errors/app.error';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class DisableUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
  ) {}

  async execute(userId: string, tenantId: string): Promise<void> {
    const user = await this.userRepo.findById(userId, tenantId);
    if (!user) throw new NotFoundError('User', userId);

    const activeAdminCount = await this.userRepo.countActiveAdmins(tenantId);
    user.disable(activeAdminCount);

    await this.userRepo.save(user);
    await this.eventBus.publish('user.disabled', { userId: user.id, tenantId, at: new Date().toISOString() });
  }
}
