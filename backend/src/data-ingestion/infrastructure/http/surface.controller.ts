import { Controller, Post, Body, Param, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../../../shared/auth/current-user.decorator';
import type { JwtPayload } from '../../../shared/auth/jwt-payload';
import { Roles } from '../../../shared/auth/roles.decorator';
import { Role } from '../../../shared/auth/role.enum';
import { LookupSurfaceUseCase } from '../../application/use-cases/lookup-surface.use-case';
import { OverrideSurfaceUseCase } from '../../application/use-cases/override-surface.use-case';
import { GetSurfaceUseCase } from '../../application/use-cases/get-surface.use-case';

@Controller()
export class SurfaceController {
  constructor(
    private readonly lookupSurface: LookupSurfaceUseCase,
    private readonly overrideSurface: OverrideSurfaceUseCase,
    private readonly getSurface: GetSurfaceUseCase,
  ) {}

  @Post('projects/:projectId/surface/lookup')
  @Roles(Role.SOLAR_CONSULTANT, Role.INVENTORY_MANAGER)
  async lookup(
    @Param('projectId') projectId: string,
    @Body() body: any,
    @CurrentUser() user: JwtPayload,
  ) {
    const record = await this.lookupSurface.execute({
      tenantId: user.tenantId,
      projectId,
      address: body.address,
      coords: body.coords,
    });
    return { id: record.id, usableSqMeters: record.estimatedUsableSqMeters };
  }

  @Get('surface/:id')
  async getRecord(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const record = await this.getSurface.execute(id, user.tenantId);
    return {
      id: record.id,
      usableSqMeters: record.estimatedUsableSqMeters,
      annualIrradiation: record.annualIrradiationKwhPerSqM,
    };
  }

  @Patch('surface/:id')
  @Roles(Role.SOLAR_CONSULTANT, Role.INVENTORY_MANAGER)
  async overrideUsableArea(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: JwtPayload,
  ) {
    const record = await this.overrideSurface.execute({
      id,
      tenantId: user.tenantId,
      usableSqMeters: body.usableSqMeters,
    });
    return { id: record.id, usableSqMeters: record.estimatedUsableSqMeters };
  }
}
