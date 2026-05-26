import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { DisableUserUseCase } from '../application/use-cases/disable-user.use-case';
import { GetMeUseCase } from '../application/use-cases/get-me.use-case';
import { ListUsersUseCase } from '../application/use-cases/list-users.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { SignupTenantUseCase } from '../application/use-cases/signup-tenant.use-case';
import { UpdateUserRoleUseCase } from '../application/use-cases/update-user-role.use-case';
import { PASSWORD_HASHER } from '../application/ports/password-hasher.port';
import { TOKEN_SIGNER } from '../application/ports/token-signer.port';
import { TENANT_REPOSITORY } from '../domain/repositories/tenant.repository';
import { USER_REPOSITORY } from '../domain/repositories/user.repository';
import { BcryptPasswordHasherAdapter } from './adapters/bcrypt-password-hasher.adapter';
import { JwtTokenSignerAdapter } from './adapters/jwt-token-signer.adapter';
import { AuthController } from './http/auth.controller';
import { UsersController } from './http/users.controller';
import { TenantOrmEntity } from './persistence/tenant.orm-entity';
import { TypeOrmTenantRepository } from './persistence/typeorm-tenant.repository';
import { TypeOrmUserRepository } from './persistence/typeorm-user.repository';
import { UserOrmEntity } from './persistence/user.orm-entity';

@Module({
  imports: [TypeOrmModule.forFeature([TenantOrmEntity, UserOrmEntity])],
  controllers: [AuthController, UsersController],
  providers: [
    // Use cases
    SignupTenantUseCase,
    LoginUseCase,
    CreateUserUseCase,
    ListUsersUseCase,
    GetMeUseCase,
    DisableUserUseCase,
    UpdateUserRoleUseCase,
    // Repository bindings
    { provide: TENANT_REPOSITORY, useClass: TypeOrmTenantRepository },
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    // Adapter bindings
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasherAdapter },
    { provide: TOKEN_SIGNER, useClass: JwtTokenSignerAdapter },
  ],
})
export class UserTenantModule {}
