import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../shared/auth/current-user.decorator';
import type { JwtPayload } from '../../../shared/auth/jwt-payload';
import { Roles } from '../../../shared/auth/roles.decorator';
import { Role } from '../../../shared/auth/role.enum';
import { CreateAlertPolicyUseCase } from '../../application/use-cases/create-alert-policy.use-case';
import { UpdateAlertPolicyUseCase } from '../../application/use-cases/update-alert-policy.use-case';
import { EnableDisableAlertPolicyUseCase } from '../../application/use-cases/enable-disable-alert-policy.use-case';
import { ListPoliciesUseCase } from '../../application/use-cases/list-policies.use-case';
import type { AlertPolicy } from '../../domain/entities/alert-policy.entity';

function toOutput(policy: AlertPolicy, userId: string) {
  return {
    id: policy.id,
    tenantId: policy.tenantId,
    projectId: policy.projectId,
    strategyKind: policy.strategyKind,
    config: policy.config,
    enabled: policy.enabled,
    /** Per-user: true means the calling user has muted this policy */
    muted: policy.isMutedForUser(userId),
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  };
}

@Controller('alerts/policies')
export class PoliciesController {
  constructor(
    private readonly create: CreateAlertPolicyUseCase,
    private readonly update: UpdateAlertPolicyUseCase,
    private readonly enableDisable: EnableDisableAlertPolicyUseCase,
    private readonly list: ListPoliciesUseCase,
  ) {}

  @Post()
  @Roles(Role.SOLAR_CONSULTANT, Role.OPERATIONS, Role.TENANT_ADMIN)
  async createPolicy(@Body() body: any, @CurrentUser() user: JwtPayload) {
    const policy = await this.create.execute({
      tenantId: user.tenantId,
      projectId: body.projectId,
      strategyKind: body.strategyKind,
      config: body.config,
    });
    return toOutput(policy, user.sub);
  }

  @Get()
  async listPolicies(@Query('projectId') projectId: string | undefined, @CurrentUser() user: JwtPayload) {
    const policies = await this.list.execute(user.tenantId, projectId);
    return policies.map(p => toOutput(p, user.sub));
  }

  @Patch(':id')
  @Roles(Role.OPERATIONS, Role.TENANT_ADMIN)
  async updatePolicy(@Param('id') id: string, @Body() body: any, @CurrentUser() user: JwtPayload) {
    const policy = await this.update.execute(id, user.tenantId, body.config);
    return toOutput(policy, user.sub);
  }

  /** Per-user mute: stop receiving notifications for this policy. */
  @Post(':id/mute')
  async mute(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const policy = await this.enableDisable.execute(id, user.tenantId, user.sub, true);
    return toOutput(policy, user.sub);
  }

  /** Per-user unmute: resume receiving notifications for this policy. */
  @Post(':id/unmute')
  async unmute(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const policy = await this.enableDisable.execute(id, user.tenantId, user.sub, false);
    return toOutput(policy, user.sub);
  }

  // Keep legacy enable/disable endpoints for backward compat (map to mute/unmute)
  @Post(':id/enable')
  async enable(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.unmute(id, user);
  }

  @Post(':id/disable')
  async disable(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.mute(id, user);
  }
}
