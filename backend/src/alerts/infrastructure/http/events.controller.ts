import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../shared/auth/current-user.decorator';
import type { JwtPayload } from '../../../shared/auth/jwt-payload';
import { ListAlertEventsUseCase } from '../../application/use-cases/list-alert-events.use-case';
import { AcknowledgeAlertEventUseCase } from '../../application/use-cases/acknowledge-alert-event.use-case';
import type { AlertEventFilter } from '../../domain/repositories/alert-event.repository';

@Controller('alerts/events')
export class EventsController {
  constructor(
    private readonly listEvents: ListAlertEventsUseCase,
    private readonly acknowledge: AcknowledgeAlertEventUseCase,
  ) {}

  /** All authenticated users can read alert events for their tenant. */
  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('severity') severity?: string,
    @Query('acknowledged') acknowledged?: string,
    @Query('since') since?: string,
    @Query('projectId') projectId?: string,
    @Query('source') source?: string,
  ) {
    const filter: AlertEventFilter = {
      tenantId: user.tenantId,
      severity,
      acknowledged: acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined,
      since: since ? new Date(since) : undefined,
      projectId,
      source: source === 'policy' || source === 'activity' ? source : undefined,
    };
    return this.listEvents.execute(filter);
  }

  /** All authenticated users can acknowledge events. */
  @Post(':id/acknowledge')
  async acknowledgeEvent(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.acknowledge.execute(id, user.tenantId, user.sub);
  }
}
