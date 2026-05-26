import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PROPOSAL_REPOSITORY } from '../../domain/repositories/proposal.repository';
import type { ProposalRepository } from '../../domain/repositories/proposal.repository';
import { PDF_RENDERER_PORT } from '../ports/pdf-renderer.port';
import type { PdfRendererPort } from '../ports/pdf-renderer.port';
import { BLOB_STORAGE_PORT } from '../../../data-ingestion/application/ports/blob-storage.port';
import type { BlobStoragePort } from '../../../data-ingestion/application/ports/blob-storage.port';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';

@Injectable()
export class ExportProposalPdfUseCase {
  constructor(
    @Inject(PROPOSAL_REPOSITORY)
    private readonly repo: ProposalRepository,
    @Inject(PDF_RENDERER_PORT)
    private readonly pdfRenderer: PdfRendererPort,
    @Inject(BLOB_STORAGE_PORT)
    private readonly blobStorage: BlobStoragePort,
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBus,
  ) {}

  async execute(id: string, tenantId: string): Promise<{ url: string }> {
    const proposal = await this.repo.findById(id, tenantId);
    if (!proposal) throw new NotFoundException(`Proposal ${id} not found.`);

    const pdfBuffer = await this.pdfRenderer.render(proposal);
    const pdfRef = await this.blobStorage.save(pdfBuffer, 'application/pdf');

    proposal.markExported(pdfRef);
    await this.repo.save(proposal);

    await this.eventBus.publish('proposal.exported', {
      proposalId: proposal.id,
      tenantId: proposal.tenantId,
      pdfRef,
    });

    return { url: pdfRef };
  }
}
