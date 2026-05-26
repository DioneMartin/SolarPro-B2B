import { Body, Controller, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../../shared/auth/current-user.decorator';
import type { JwtPayload } from '../../../shared/auth/jwt-payload';
import { Roles } from '../../../shared/auth/roles.decorator';
import { Role } from '../../../shared/auth/role.enum';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { DisableUserUseCase } from '../../application/use-cases/disable-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { UpdateUserRoleUseCase } from '../../application/use-cases/update-user-role.use-case';
import { CreateUserRequestDto } from './dto/create-user.request.dto';
import { UpdateRoleRequestDto } from './dto/update-role.request.dto';

@Controller('users')
@Roles(Role.TENANT_ADMIN)
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly disableUser: DisableUserUseCase,
    private readonly updateRole: UpdateUserRoleUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateUserRequestDto, @CurrentUser() actor: JwtPayload) {
    return this.createUser.execute({
      tenantId: actor.tenantId,
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      role: dto.role,
    });
  }

  @Get()
  async list(@CurrentUser() actor: JwtPayload) {
    return this.listUsers.execute(actor.tenantId);
  }

  @Patch(':id/role')
  async changeRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleRequestDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.updateRole.execute(id, actor.tenantId, dto.role);
  }

  @HttpCode(204)
  @Patch(':id/disable')
  async disable(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    await this.disableUser.execute(id, actor.tenantId);
  }
}
