import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';
import { ConflictError } from '../../../shared/errors/app.error';
import { Tenant } from '../../domain/entities/tenant.entity';
import { User } from '../../domain/entities/user.entity';
import { TenantCreatedEvent } from '../../domain/events/tenant-created.event';
import { UserCreatedEvent } from '../../domain/events/user-created.event';
import { TENANT_REPOSITORY } from '../../domain/repositories/tenant.repository';
import type { TenantRepository } from '../../domain/repositories/tenant.repository';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { UserRole } from '../../domain/value-objects/user-role.enum';
import type { SignupTenantInput } from '../dto/signup-tenant.input';
import type { AuthResultOutput } from '../dto/auth-result.output';
import { PASSWORD_HASHER } from '../ports/password-hasher.port';
import type { PasswordHasherPort } from '../ports/password-hasher.port';
import { TOKEN_SIGNER } from '../ports/token-signer.port';
import type { TokenSignerPort } from '../ports/token-signer.port';

@Injectable()
export class SignupTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly tenantRepo: TenantRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_SIGNER) private readonly signer: TokenSignerPort,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
  ) {}

  async execute(input: SignupTenantInput): Promise<AuthResultOutput> {
    const existing = await this.tenantRepo.findBySlug(input.slug);
    if (existing) {
      throw new ConflictError(`Tenant slug "${input.slug}" is already taken`);
    }

    const tenant = Tenant.create({ id: uuidv4(), name: input.tenantName, slug: input.slug });

    const passwordHash = await this.hasher.hash(input.adminPassword);
    const admin = User.create({
      id: uuidv4(),
      tenantId: tenant.id,
      email: input.adminEmail,
      passwordHash,
      fullName: input.adminFullName,
      role: UserRole.TENANT_ADMIN,
    });

    await this.tenantRepo.save(tenant);
    await this.userRepo.save(admin);

    await this.eventBus.publish('tenant.created', new TenantCreatedEvent(tenant.id, tenant.slug, tenant.createdAt));
    await this.eventBus.publish('user.created', new UserCreatedEvent(admin.id, admin.tenantId, admin.role, admin.createdAt));

    const token = this.signer.sign({ sub: admin.id, tenantId: tenant.id, role: admin.role });

    return {
      accessToken: token,
      user: { id: admin.id, email: admin.email.value, fullName: admin.fullName, role: admin.role, tenantId: admin.tenantId },
    };
  }
}
