import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { IStorageService, StorageUploadResult } from './storage.interface';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly basePath: string;

  constructor() {
    this.basePath = path.resolve(process.env.STORAGE_LOCAL_PATH || './storage/uploads');
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async uploadFile(
    applicantId: string,
    category: 'documents' | 'videos' | 'cv' | 'cover-letters',
    filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<StorageUploadResult> {
    const fileId = uuidv4();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `nexora/applicants/${applicantId}/${category}/${fileId}_${sanitizedFilename}`;

    const targetDir = path.join(this.basePath, 'nexora', 'applicants', applicantId, category);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fullFilePath = path.join(this.basePath, storageKey);
    await fs.promises.writeFile(fullFilePath, buffer);

    this.logger.log(`Uploaded file to ${storageKey} (${buffer.length} bytes)`);

    const url = `/api/storage/file?key=${encodeURIComponent(storageKey)}`;

    return {
      storageKey,
      filename: sanitizedFilename,
      fileSize: buffer.length,
      mimeType,
      url,
    };
  }

  async getFileStream(storageKey: string): Promise<Readable> {
    const fullPath = this.resolveSafePath(storageKey);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(`File not found for key: ${storageKey}`);
    }
    return fs.createReadStream(fullPath);
  }

  async getFileBuffer(storageKey: string): Promise<Buffer> {
    const fullPath = this.resolveSafePath(storageKey);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(`File not found for key: ${storageKey}`);
    }
    return fs.promises.readFile(fullPath);
  }

  async getSecureUrl(storageKey: string, expiresInSeconds = 3600): Promise<string> {
    return `/api/storage/file?key=${encodeURIComponent(storageKey)}&exp=${Date.now() + expiresInSeconds * 1000}`;
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    const fullPath = this.resolveSafePath(storageKey);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
    return false;
  }

  private resolveSafePath(storageKey: string): string {
    const normalizedKey = path.normalize(storageKey).replace(/^(\.\.[\/\\])+/, '');
    return path.join(this.basePath, normalizedKey);
  }
}
