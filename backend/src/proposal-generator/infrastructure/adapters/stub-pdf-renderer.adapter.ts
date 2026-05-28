import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { PdfRendererPort } from '../../application/ports/pdf-renderer.port';
import type { Proposal } from '../../domain/entities/proposal.entity';
import type { RawProposal } from '../../../shared/types/calculation.types';

/**
 * Generates a real PDF document using PDFKit with the proposal data.
 */
@Injectable()
export class StubPdfRendererAdapter implements PdfRendererPort {
  private readonly logger = new Logger(StubPdfRendererAdapter.name);

  async render(proposal: Proposal): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header ──
      doc
        .fontSize(22)
        .fillColor('#1971c2')
        .text('SolarPro', { align: 'center' })
        .fontSize(16)
        .fillColor('#333')
        .text('Propuesta Solar', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .fillColor('#666')
        .text(`ID: ${proposal.id}`, { align: 'right' })
        .text(`Proyecto: ${proposal.projectId}`, { align: 'right' })
        .text(`Fecha: ${proposal.createdAt.toLocaleDateString('es-MX')}`, { align: 'right' })
        .moveDown(1);

      // ── Divider ──
      this.drawDivider(doc);

      const opt = proposal.optimal;
      if (!opt) {
        doc.fontSize(12).fillColor('#333').text('No se encontró una combinación óptima.').moveDown();
        doc.end();
        return;
      }

      // ── System summary ──
      doc.fontSize(14).fillColor('#1971c2').text('Resumen del sistema', { underline: true }).moveDown(0.3);

      const systemKwp = ((opt.panel.spec.wattagePeakW * opt.panelCount) / 1000).toFixed(2);

      this.keyValue(doc, 'Panel', `${opt.panel.brand} ${opt.panel.modelName}`);
      this.keyValue(doc, 'Inversor', `${opt.inverter.brand} ${opt.inverter.modelName}`);
      this.keyValue(doc, 'Cantidad de paneles', `${opt.panelCount}`);
      this.keyValue(doc, 'Potencia del sistema', `${systemKwp} kWp`);
      this.keyValue(doc, 'Superficie utilizada', `${opt.layout.usedSqMeters.toFixed(1)} m² de ${opt.layout.availableSqMeters.toFixed(1)} m²`);
      doc.moveDown(0.5);

      // ── Energy ──
      this.drawDivider(doc);
      doc.fontSize(14).fillColor('#1971c2').text('Producción de energía', { underline: true }).moveDown(0.3);

      this.keyValue(doc, 'Consumo anual', `${opt.energy.annualConsumptionKwh.toLocaleString('es-MX')} kWh`);
      this.keyValue(doc, 'Producción anual estimada', `${opt.energy.annualProductionKwh.toLocaleString('es-MX')} kWh`);
      this.keyValue(doc, 'Cobertura', `${opt.energy.coveragePct.toFixed(1)}%`);
      doc.moveDown(0.5);

      // ── Finance ──
      this.drawDivider(doc);
      doc.fontSize(14).fillColor('#1971c2').text('Análisis financiero', { underline: true }).moveDown(0.3);

      this.keyValue(doc, 'Inversión total (CAPEX)', `${opt.finance.capexTotal.amount.toLocaleString('es-MX')} ${opt.finance.capexTotal.currency}`);
      this.keyValue(doc, 'Retorno de inversión (20 años)', `${opt.finance.roi20YearPct.toFixed(1)}%`);
      if (opt.finance.paybackYear != null) {
        this.keyValue(doc, 'Periodo de retorno', `${opt.finance.paybackYear.toFixed(1)} años`);
      }
      if (opt.finance.npv) {
        this.keyValue(doc, 'VPN', `${opt.finance.npv.amount.toLocaleString('es-MX')} ${opt.finance.npv.currency}`);
      }
      doc.moveDown(0.5);

      // ── Candidates summary ──
      if (proposal.rawCandidates.length > 1) {
        this.drawDivider(doc);
        doc.fontSize(14).fillColor('#1971c2').text('Otras combinaciones evaluadas', { underline: true }).moveDown(0.3);
        doc.fontSize(9).fillColor('#666');

        const candidates = proposal.rawCandidates.slice(0, 10); // cap at 10
        for (const c of candidates) {
          if (c.id === opt.id) continue;
          this.candidateRow(doc, c);
        }
        if (proposal.rawCandidates.length > 10) {
          doc.text(`... y ${proposal.rawCandidates.length - 10} combinaciones más.`);
        }
        doc.moveDown(0.5);
      }

      // ── Footer ──
      this.drawDivider(doc);
      doc
        .fontSize(8)
        .fillColor('#999')
        .text(
          'Este documento fue generado automáticamente por SolarPro. Los valores son estimaciones basadas en la información proporcionada.',
          { align: 'center' },
        )
        .text(`Generado: ${new Date().toISOString()}`, { align: 'center' });

      doc.end();
    });
  }

  private keyValue(doc: PDFKit.PDFDocument, label: string, value: string): void {
    doc
      .fontSize(10)
      .fillColor('#666')
      .text(`${label}: `, { continued: true })
      .fillColor('#333')
      .text(value);
  }

  private candidateRow(doc: PDFKit.PDFDocument, c: RawProposal): void {
    const kWp = ((c.panel.spec.wattagePeakW * c.panelCount) / 1000).toFixed(2);
    doc.text(
      `• ${c.panel.brand} ${c.panel.modelName} × ${c.panelCount} (${kWp} kWp) — ` +
      `${c.finance.capexTotal.amount.toLocaleString('es-MX')} ${c.finance.capexTotal.currency} — ` +
      `ROI ${c.finance.roi20YearPct.toFixed(1)}%` +
      (c.finance.paybackYear != null ? ` — Retorno ${c.finance.paybackYear.toFixed(1)} años` : ''),
    );
  }

  private drawDivider(doc: PDFKit.PDFDocument): void {
    const y = doc.y;
    doc
      .moveTo(50, y)
      .lineTo(562, y)
      .strokeColor('#ddd')
      .stroke()
      .moveDown(0.5);
  }
}
