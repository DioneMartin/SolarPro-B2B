import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';
import { User } from '../../domain/entities/user.entity';
import { DuplicateEmailError } from '../../domain/errors/duplicate-email.error';
import { UserCreatedEvent } from '../../domain/events/user-created.event';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { CreateUserInput } from '../dto/create-user.input';
import type { UserOutput } from '../dto/user.output';
import { PASSWORD_HASHER } from '../ports/password-hasher.port';
import type { PasswordHasherPort } from '../ports/password-hasher.port';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    const existing = await this.userRepo.findByEmail(input.email, input.tenantId);
    if (existing) {
      throw new DuplicateEmailError(input.email);
    }

    const passwordHash = await this.hasher.hash(input.password);
    const user = User.create({
      id: uuidv4(),
      tenantId: input.tenantId,
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      role: input.role,
    });

    await this.userRepo.save(user);
    await this.eventBus.publish('user.created', new UserCreatedEvent(user.id, user.tenantId, user.role, user.createdAt));

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
