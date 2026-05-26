import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../shared/auth/current-user.decorator';
import type { JwtPayload } from '../../../shared/auth/jwt-payload';
import { Roles } from '../../../shared/auth/roles.decorator';
import { Role } from '../../../shared/auth/role.enum';
import { CreateAlertPolicyUseCase } from '../../application/use-cases/create-alert-policy.use-case';
import { UpdateAlertPolicyUseCase } from '../../application/use-cases/update-alert-policy.use-case';
import { EnableDisableAlertPolicyUseCase } from '../../application/use-cases/enable-disable-alert-policy.use-case';
import { ListPoliciesUseCase } from '../../application/use-cases/list-policies.use-case';

@Controller('alerts/policies')
export class PoliciesController {
  constructor(
    private readonly create: CreateAlertPolicyUseCase,
    private readonly update: UpdateAlertPolicyUseCase,
    private readonly enableDisable: EnableDisableAlertPolicyUseCase,
    private readonly list: ListPoliciesUseCase,
  ) {}

  @Post()
  @Roles(Role.SOLAR_CONSULTANT, Role.OPERATIONS)
  async createPolicy(@Body() body: any, @CurrentUser() user: JwtPayload) {
    return this.create.execute({
      tenantId: user.tenantId,
      projectId: body.projectId,
      strategyKind: body.strategyKind,
      config: body.config,
    });
  }

  @Get()
  async listPolicies(@Query('projectId') projectId: string | undefined, @CurrentUser() user: JwtPayload) {
    return this.list.execute(user.tenantId, projectId);
  }

  @Patch(':id')
  @Roles(Role.OPERATIONS)
  async updatePolicy(@Param('id') id: string, @Body() body: any, @CurrentUser() user: JwtPayload) {
    return this.update.execute(id, user.tenantId, body.config);
  }

  @Post(':id/enable')
  @Roles(Role.OPERATIONS)
  async enable(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.enableDisable.execute(id, user.tenantId, true);
  }

  @Post(':id/disable')
  @Roles(Role.OPERATIONS)
  async disable(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.enableDisable.execute(id, user.tenantId, false);
  }
}
