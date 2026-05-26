import { Injectable, Logger } from '@nestjs/common';
import type { PdfRendererPort } from '../../application/ports/pdf-renderer.port';
import type { Proposal } from '../../domain/entities/proposal.entity';

/**
 * Stub PDF renderer — returns a minimal valid PDF placeholder.
 * Replace with a Puppeteer-based implementation (install `puppeteer` package)
 * when PDF generation is required. The interface is stable.
 *
 * TODO(v1.1): Replace with PuppeteerPdfRendererAdapter.
 */
@Injectable()
export class StubPdfRendererAdapter implements PdfRendererPort {
  private readonly logger = new Logger(StubPdfRendererAdapter.name);

  async render(proposal: Proposal): Promise<Buffer> {
    this.logger.warn(`Stub PDF renderer invoked for proposal ${proposal.id}. Install puppeteer for real output.`);
    // Minimal PDF header so the Buffer is a parseable file
    const content =
      `%PDF-1.4\n% SolarPro Proposal ${proposal.id}\n` +
      `% Project: ${proposal.projectId}\n` +
      `% Generated: ${new Date().toISOString()}\n` +
      `% Optimal panel: ${proposal.optimal?.panel.brand ?? 'N/A'} ${proposal.optimal?.panel.modelName ?? ''}\n` +
      `% Capex: ${proposal.optimal?.finance.capexTotal.amount ?? 'N/A'} ${proposal.optimal?.finance.capexTotal.currency ?? ''}\n`;
    return Buffer.from(content, 'utf-8');
  }
}
