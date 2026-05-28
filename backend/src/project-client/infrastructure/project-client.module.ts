import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachConsumptionUseCase, AttachSurfaceUseCase } from '../application/use-cases/attach-data.use-case';
import { CreateClientUseCase } from '../application/use-cases/create-client.use-case';
import { CreateProjectUseCase } from '../application/use-cases/create-project.use-case';
import { GetClientUseCase } from '../application/use-cases/get-client.use-case';
import { GetDashboardUseCase } from '../application/use-cases/get-dashboard.use-case';
import { GetProjectUseCase } from '../application/use-cases/get-project.use-case';
import { ListClientsUseCase } from '../application/use-cases/list-clients.use-case';
import { ListProjectsUseCase } from '../application/use-cases/list-projects.use-case';
import { ApproveProjectUseCase, MarkReadyForProposalUseCase, SelectProposalUseCase } from '../application/use-cases/project-transitions.use-case';
import { UpdateClientUseCase } from '../application/use-cases/update-client.use-case';
import { OnIngestionCompletedHandler } from '../application/event-handlers/on-ingestion-completed.handler';
import { CLIENT_REPOSITORY } from '../domain/repositories/client.repository';
import { PROJECT_REPOSITORY } from '../domain/repositories/project.repository';
import { DashboardController } from './http/dashboard.controller';
import { ClientsController } from './http/clients.controller';
import { ProjectsController } from './http/projects.controller';
import { ClientOrmEntity } from './persistence/client.orm-entity';
import { ProjectOrmEntity } from './persistence/project.orm-entity';
import { TypeOrmClientRepository } from './persistence/typeorm-client.repository';
import { TypeOrmProjectRepository } from './persistence/typeorm-project.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ClientOrmEntity, ProjectOrmEntity])],
  controllers: [ClientsController, ProjectsController, DashboardController],
  providers: [
    // Use cases — clients
    CreateClientUseCase,
    ListClientsUseCase,
    GetClientUseCase,
    UpdateClientUseCase,
    // Use cases — projects
    CreateProjectUseCase,
    ListProjectsUseCase,
    GetProjectUseCase,
    AttachConsumptionUseCase,
    AttachSurfaceUseCase,
    MarkReadyForProposalUseCase,
    SelectProposalUseCase,
    ApproveProjectUseCase,
    GetDashboardUseCase,
    // Event handlers
    OnIngestionCompletedHandler,
    // Repository bindings
    { provide: CLIENT_REPOSITORY, useClass: TypeOrmClientRepository },
    { provide: PROJECT_REPOSITORY, useClass: TypeOrmProjectRepository },
  ],
  exports: [PROJECT_REPOSITORY],
})
export class ProjectClientModule {}
