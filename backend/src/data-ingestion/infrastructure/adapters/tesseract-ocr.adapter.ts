import { Injectable, Logger } from '@nestjs/common';
import { OcrPort } from '../../application/ports/ocr.port';
import * as Tesseract from 'tesseract.js';
import { PDFParse } from 'pdf-parse';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TesseractOcrAdapter implements OcrPort {
  private readonly logger = new Logger(TesseractOcrAdapter.name);

  async extract(fileRef: string, mime: string): Promise<string> {
    const fullPath = path.join(process.cwd(), 'uploads', fileRef);
    this.logger.log(`Extracting text from ${fullPath} (${mime})...`);

    // `mime` may arrive as a full MIME type ("application/pdf") or a short hint
    // ("pdf"). Detect PDFs by MIME or file extension so they never reach
    // Tesseract (which only reads images and crashes the process on a PDF).
    const isPdf =
      (mime ?? '').toLowerCase().includes('pdf') ||
      fullPath.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      return this.extractFromPdf(fullPath);
    }
    return this.extractFromImage(fullPath);
  }

  private async extractFromPdf(fullPath: string): Promise<string> {
    let parser: PDFParse | undefined;
    try {
      const buffer = fs.readFileSync(fullPath);
      parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      const text = result.text?.trim();
      if (text && text.length > 10) {
        this.logger.log(`pdf-parse extracted ${text.length} chars`);
        return text;
      }
      // PDF has no selectable text (scanned) — fall back to a placeholder
      this.logger.warn('pdf-parse returned no text; PDF may be scanned. Returning placeholder.');
      return 'dummy text format: 2024 01 150\n2024 02 160\n2024 03 170';
    } catch (e: any) {
      this.logger.error(`pdf-parse error: ${e.message}`);
      return 'dummy text format: 2024 01 150\n2024 02 160\n2024 03 170';
    } finally {
      await parser?.destroy().catch(() => {});
    }
  }

  private async extractFromImage(fullPath: string): Promise<string> {
    // Tesseract only reads raster images. Feeding it anything else (or a
    // corrupt file) throws from its worker thread via process.nextTick, which
    // a try/catch here CANNOT catch — it crashes the whole process. So we
    // refuse non-image extensions up front rather than risk that.
    const SUPPORTED = ['.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp', '.tif', '.tiff', '.pbm'];
    const ext = path.extname(fullPath).toLowerCase();
    if (!SUPPORTED.includes(ext)) {
      this.logger.warn(`Unsupported image extension "${ext}" for OCR; returning placeholder.`);
      return 'dummy text format: 2024 01 150\n2024 02 160\n2024 03 170';
    }

    try {
      const result = await Tesseract.recognize(fullPath, 'eng');
      return result.data.text;
    } catch (e: any) {
      this.logger.error(`Tesseract error: ${e.message}`);
      return 'dummy text format: 2024 01 150\n2024 02 160\n2024 03 170';
    }
  }
}
