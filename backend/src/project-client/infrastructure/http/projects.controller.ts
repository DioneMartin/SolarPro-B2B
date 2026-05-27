import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../../shared/auth/current-user.decorator';
import type { JwtPayload } from '../../../shared/auth/jwt-payload';
import { Roles } from '../../../shared/auth/roles.decorator';
import { Role } from '../../../shared/auth/role.enum';
import { AttachConsumptionUseCase, AttachSurfaceUseCase } from '../../application/use-cases/attach-data.use-case';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import { GetProjectUseCase } from '../../application/use-cases/get-project.use-case';
import { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import { ApproveProjectUseCase, MarkReadyForProposalUseCase, SelectProposalUseCase } from '../../application/use-cases/project-transitions.use-case';
import { ProjectStatus } from '../../domain/value-objects/project-status.enum';
import { CreateProjectRequestDto } from './dto/create-project.request.dto';

@Controller('projects')
@Roles(Role.SOLAR_CONSULTANT)
export class ProjectsController {
  constructor(
    private readonly createProject: CreateProjectUseCase,
    private readonly listProjects: ListProjectsUseCase,
    private readonly getProject: GetProjectUseCase,
    private readonly attachConsumption: AttachConsumptionUseCase,
    private readonly attachSurface: AttachSurfaceUseCase,
    private readonly markReady: MarkReadyForProposalUseCase,
    private readonly selectProposal: SelectProposalUseCase,
    private readonly approveProject: ApproveProjectUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateProjectRequestDto, @CurrentUser() user: JwtPayload) {
    return this.createProject.execute({
      tenantId: user.tenantId,
      clientId: dto.clientId,
      name: dto.name,
      siteAddress: dto.siteAddress,
      energyDemandTargetPct: dto.energyDemandTargetPct,
    });
  }

  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('clientId') clientId?: string,
    @Query('status') status?: ProjectStatus,
  ) {
    return this.listProjects.execute({ tenantId: user.tenantId, clientId, status });
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.getProject.execute(id, user.tenantId);
  }

  @Put(':id/consumption/:refId')
  async attachConsumptionRef(@Param('id') id: string, @Param('refId') refId: string, @CurrentUser() user: JwtPayload) {
    return this.attachConsumption.execute(id, user.tenantId, refId);
  }

  @Put(':id/surface/:refId')
  async attachSurfaceRef(@Param('id') id: string, @Param('refId') refId: string, @CurrentUser() user: JwtPayload) {
    return this.attachSurface.execute(id, user.tenantId, refId);
  }

  @Put(':id/ready-for-proposal')
  async markReadyForProposal(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.markReady.execute(id, user.tenantId);
  }

  @Put(':id/select-proposal/:proposalId')
  async selectProposalForProject(@Param('id') id: string, @Param('proposalId') proposalId: string, @CurrentUser() user: JwtPayload) {
    return this.selectProposal.execute(id, user.tenantId, proposalId);
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.approveProject.execute(id, user.tenantId);
  }
}
