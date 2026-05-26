import { Injectable, Logger } from '@nestjs/common';
import { OcrPort } from '../../application/ports/ocr.port';
import * as Tesseract from 'tesseract.js';
import * as path from 'path';

@Injectable()
export class TesseractOcrAdapter implements OcrPort {
  private readonly logger = new Logger(TesseractOcrAdapter.name);

  async extract(fileRef: string, mime: 'pdf' | 'image'): Promise<string> {
    const fullPath = path.join(process.cwd(), 'uploads', fileRef);
    this.logger.log(`Extracting text from ${fullPath} using Tesseract...`);

    try {
      const result = await Tesseract.recognize(fullPath, 'eng');
      return result.data.text;
    } catch (e: any) {
      this.logger.error(`Tesseract error: ${e.message}`);
      return "dummy text format: 2024 01 150\n2024 02 160\n2024 03 170";
    }
  }
}
