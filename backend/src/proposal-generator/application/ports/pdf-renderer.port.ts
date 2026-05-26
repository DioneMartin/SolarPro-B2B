import type { Proposal } from '../../domain/entities/proposal.entity';

export interface PdfRendererPort {
  render(proposal: Proposal): Promise<Buffer>;
}

export const PDF_RENDERER_PORT = 'PDF_RENDERER_PORT';
