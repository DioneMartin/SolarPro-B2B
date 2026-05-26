import { Inject, Injectable } from '@nestjs/common';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { TENANT_REPOSITORY } from '../../domain/repositories/tenant.repository';
import type { TenantRepository } from '../../domain/repositories/tenant.repository';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { AuthResultOutput } from '../dto/auth-result.output';
import type { LoginInput } from '../dto/login.input';
import { PASSWORD_HASHER } from '../ports/password-hasher.port';
import type { PasswordHasherPort } from '../ports/password-hasher.port';
import { TOKEN_SIGNER } from '../ports/token-signer.port';
import type { TokenSignerPort } from '../ports/token-signer.port';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly tenantRepo: TenantRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_SIGNER) private readonly signer: TokenSignerPort,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
  ) {}

  async execute(input: LoginInput): Promise<AuthResultOutput> {
    const tenant = await this.tenantRepo.findBySlug(input.tenantSlug);
    if (!tenant || !tenant.isActive()) {
      throw new InvalidCredentialsError();
    }

    const user = await this.userRepo.findByEmail(input.email.toLowerCase().trim(), tenant.id);
    if (!user || !user.isActive()) {
      throw new InvalidCredentialsError();
    }

    const valid = await this.hasher.verify(input.password, user.passwordHash);
    if (!valid) {
      throw new InvalidCredentialsError();
    }

    const token = this.signer.sign({ sub: user.id, tenantId: tenant.id, role: user.role });

    await this.eventBus.publish('user.logged_in', { userId: user.id, tenantId: tenant.id });

    return {
      accessToken: token,
      user: { id: user.id, email: user.email.value, fullName: user.fullName, role: user.role, tenantId: user.tenantId },
    };
  }
}
