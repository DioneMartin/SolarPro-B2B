import { Controller, Post, Body, Param, Get, Patch, Req } from '@nestjs/common';
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
  async lookup(
    @Param('projectId') projectId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const record = await this.lookupSurface.execute({
      tenantId,
      projectId,
      address: body.address,
      coords: body.coords,
    });
    return { id: record.id, usableSqMeters: record.estimatedUsableSqMeters };
  }

  @Get('surface/:id')
  async getRecord(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const record = await this.getSurface.execute(id, tenantId);
    return {
      id: record.id,
      usableSqMeters: record.estimatedUsableSqMeters,
      annualIrradiation: record.annualIrradiationKwhPerSqM,
    };
  }

  @Patch('surface/:id')
  async overrideUsableArea(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const record = await this.overrideSurface.execute({
      id,
      tenantId,
      usableSqMeters: body.usableSqMeters,
    });
    return { id: record.id, usableSqMeters: record.estimatedUsableSqMeters };
  }
}
