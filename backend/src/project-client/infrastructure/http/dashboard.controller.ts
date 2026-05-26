import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../../shared/auth/current-user.decorator';
import type { JwtPayload } from '../../../shared/auth/jwt-payload';
import { GetDashboardUseCase } from '../../application/use-cases/get-dashboard.use-case';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly getDashboard: GetDashboardUseCase) {}

  @Get()
  async get(@CurrentUser() user: JwtPayload) {
    return this.getDashboard.execute(user.tenantId);
  }
}
