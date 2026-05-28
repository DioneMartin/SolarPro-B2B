export const OCR_PORT = 'OCR_PORT';

export interface OcrPort {
  /** `mime` is the uploaded file's MIME type (e.g. "application/pdf", "image/png"). */
  extract(fileRef: string, mime: string): Promise<string>;
}
