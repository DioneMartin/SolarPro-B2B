import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../../catalog/infrastructure/catalog.module';
import { DataIngestionModule } from '../../data-ingestion/infrastructure/data-ingestion.module';
import { SolarCalculationModule } from '../../solar-calculation/infrastructure/solar-calculation.module';
import { EventBusModule } from '../../shared/event-bus/event-bus.module';
import { PROPOSAL_REPOSITORY } from '../domain/repositories/proposal.repository';
import { PDF_RENDERER_PORT } from '../application/ports/pdf-renderer.port';
import { ProposalQueryFactory } from '../application/factories/proposal-query.factory';
import { GenerateProposalUseCase } from '../application/use-cases/generate-proposal.use-case';
import { ListProposalsUseCase } from '../application/use-cases/list-proposals.use-case';
import { GetProposalUseCase } from '../application/use-cases/get-proposal.use-case';
import { DeleteProposalUseCase } from '../application/use-cases/delete-proposal.use-case';
import { ExportProposalPdfUseCase } from '../application/use-cases/export-proposal-pdf.use-case';
import { ProposalOrmEntity } from './persistence/proposal.orm-entity';
import { TypeOrmProposalRepository } from './persistence/typeorm-proposal.repository';
import { StubPdfRendererAdapter } from './adapters/stub-pdf-renderer.adapter';
import { ProposalsController } from './http/proposals.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProposalOrmEntity]),
    CatalogModule,
    DataIngestionModule,
    SolarCalculationModule,
    EventBusModule,
  ],
  controllers: [ProposalsController],
  providers: [
    // Factory
    ProposalQueryFactory,
    // Use cases
    GenerateProposalUseCase,
    ListProposalsUseCase,
    GetProposalUseCase,
    DeleteProposalUseCase,
    ExportProposalPdfUseCase,
    // Repository
    TypeOrmProposalRepository,
    { provide: PROPOSAL_REPOSITORY, useExisting: TypeOrmProposalRepository },
    // PDF renderer (stub until Puppeteer is installed)
    StubPdfRendererAdapter,
    { provide: PDF_RENDERER_PORT, useExisting: StubPdfRendererAdapter },
  ],
})
export class ProposalGeneratorModule {}
