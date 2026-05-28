import { Injectable, Logger } from '@nestjs/common';
import { OcrPort } from '../../application/ports/ocr.port';

@Injectable()
export class GoogleVisionOcrAdapter implements OcrPort {
  private readonly logger = new Logger(GoogleVisionOcrAdapter.name);

  async extract(fileRef: string, mime: string): Promise<string> {
    this.logger.log(`[Google Vision Stub] Extracting text from ${fileRef}...`);
    return "dummy text format: 2024 01 150\n2024 02 160\n2024 03 170";
  }
}
