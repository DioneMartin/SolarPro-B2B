export const BLOB_STORAGE_PORT = 'BLOB_STORAGE_PORT';

export interface BlobStoragePort {
  save(file: Buffer, mime: string): Promise<string>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
