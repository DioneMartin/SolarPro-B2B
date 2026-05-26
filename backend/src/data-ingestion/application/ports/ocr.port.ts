export const OCR_PORT = 'OCR_PORT';

export interface OcrPort {
  extract(fileRef: string, mime: 'pdf' | 'image'): Promise<string>;
}
