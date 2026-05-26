import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../shared/auth/current-user.decorator';
import type { JwtPayload } from '../../../shared/auth/jwt-payload';
import { Roles } from '../../../shared/auth/roles.decorator';
import { Role } from '../../../shared/auth/role.enum';
import { ListAlertEventsUseCase } from '../../application/use-cases/list-alert-events.use-case';
import { AcknowledgeAlertEventUseCase } from '../../application/use-cases/acknowledge-alert-event.use-case';

@Controller('alerts/events')
export class EventsController {
  constructor(
    private readonly listEvents: ListAlertEventsUseCase,
    private readonly acknowledge: AcknowledgeAlertEventUseCase,
  ) {}

  @Get()
  @Roles(Role.OPERATIONS)
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('severity') severity?: string,
    @Query('acknowledged') acknowledged?: string,
    @Query('since') since?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.listEvents.execute({
      tenantId: user.tenantId,
      severity,
      acknowledged: acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined,
      since: since ? new Date(since) : undefined,
      projectId,
    });
  }

  @Post(':id/acknowledge')
  @Roles(Role.OPERATIONS)
  async acknowledgeEvent(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.acknowledge.execute(id, user.tenantId, user.sub);
  }
}
