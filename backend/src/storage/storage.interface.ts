import { Readable } from 'stream';

export interface StorageUploadResult {
  storageKey: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export interface IStorageService {
  uploadFile(
    applicantId: string,
    category: 'documents' | 'videos' | 'cv' | 'cover-letters',
    filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<StorageUploadResult>;

  getFileStream(storageKey: string): Promise<Readable>;

  getFileBuffer(storageKey: string): Promise<Buffer>;

  getSecureUrl(storageKey: string, expiresInSeconds?: number): Promise<string>;

  deleteFile(storageKey: string): Promise<boolean>;
}

export const STORAGE_SERVICE_TOKEN = 'IStorageService';
