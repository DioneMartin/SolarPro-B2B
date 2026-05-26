import { Injectable } from '@nestjs/common';
import { BlobStoragePort } from '../../application/ports/blob-storage.port';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocalFsBlobStorageAdapter implements BlobStoragePort {
  private readonly storageDir = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureDir();
  }

  private async ensureDir() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (e) {
      // ignore
    }
  }

  async save(file: Buffer, mime: string): Promise<string> {
    await this.ensureDir();
    const ext = mime.includes('pdf') ? 'pdf' : 'png';
    const key = `${uuidv4()}.${ext}`;
    const fullPath = path.join(this.storageDir, key);
    await fs.writeFile(fullPath, file);
    return key;
  }

  async read(key: string): Promise<Buffer> {
    const fullPath = path.join(this.storageDir, key);
    return fs.readFile(fullPath);
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.storageDir, key);
    await fs.unlink(fullPath).catch(() => {});
  }
}
