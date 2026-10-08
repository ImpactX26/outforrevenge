import { Injectable, Logger } from '@nestjs/common';
import { IStorageService, StorageUploadResult } from './storage.interface';
import { LocalStorageService } from './local-storage.service';
import { Readable } from 'stream';
import * as crypto from 'crypto';

@Injectable()
export class CloudinaryStorageService implements IStorageService {
  private readonly logger = new Logger(CloudinaryStorageService.name);
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly enabled: boolean;

  constructor(private readonly localFallback: LocalStorageService) {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    this.apiKey = process.env.CLOUDINARY_API_KEY || '';
    this.apiSecret = process.env.CLOUDINARY_API_SECRET || '';

    // Support CLOUDINARY_URL (cloudinary://api_key:api_secret@cloud_name)
    const cloudinaryUrl = process.env.CLOUDINARY_URL || '';
    if (cloudinaryUrl.startsWith('cloudinary://')) {
      try {
        const parsed = new URL(cloudinaryUrl);
        this.apiKey = parsed.username || this.apiKey;
        this.apiSecret = parsed.password || this.apiSecret;
        this.cloudName = parsed.hostname || this.cloudName;
      } catch (e) {
        // ignore
      }
    }

    this.enabled = Boolean(this.cloudName && this.apiKey && this.apiSecret);
    if (this.enabled) {
      this.logger.log(`Cloudinary storage active for cloud: ${this.cloudName}`);
    } else {
      this.logger.log('Cloudinary credentials not provided. Storing files via local storage.');
    }
  }

  async uploadFile(
    applicantId: string,
    category: 'documents' | 'videos' | 'cv' | 'cover-letters',
    filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<StorageUploadResult> {
    if (!this.enabled) {
      return this.localFallback.uploadFile(applicantId, category, filename, buffer, mimeType);
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const safeApplicant = applicantId.replace(/[^a-zA-Z0-9_-]/g, '');
      const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const publicId = `nexora/${category}/${safeApplicant}_${Date.now()}_${cleanName}`;
      const folder = `nexora/${category}`;

      // Signature parameters in alphabetical order
      const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
      const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

      const formData = new FormData();
      const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
      formData.append('file', blob, filename);
      formData.append('api_key', this.apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('public_id', publicId);
      formData.append('folder', folder);
      formData.append('signature', signature);

      const resourceType = mimeType.startsWith('video/') ? 'video' : 'auto';
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`;

      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Cloudinary upload failed (${res.status}): ${errorText}`);
      }

      const data: any = await res.json();

      return {
        storageKey: data.public_id || publicId,
        filename,
        fileSize: data.bytes || buffer.length,
        mimeType,
        url: data.secure_url || data.url,
      };
    } catch (err: any) {
      this.logger.warn(`Cloudinary upload failed: ${err.message}. Falling back to local storage.`);
      return this.localFallback.uploadFile(applicantId, category, filename, buffer, mimeType);
    }
  }

  async getFileStream(storageKey: string): Promise<Readable> {
    const buffer = await this.getFileBuffer(storageKey);
    return Readable.from(buffer);
  }

  async getFileBuffer(storageKey: string): Promise<Buffer> {
    if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
      const res = await fetch(storageKey);
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf);
    }

    if (this.enabled && storageKey.startsWith('nexora/')) {
      const secureUrl = `https://res.cloudinary.com/${this.cloudName}/auto/upload/${storageKey}`;
      try {
        const res = await fetch(secureUrl);
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          return Buffer.from(arrayBuf);
        }
      } catch (e) {
        // fallback
      }
    }

    return this.localFallback.getFileBuffer(storageKey);
  }

  async getSecureUrl(storageKey: string, expiresInSeconds = 86400): Promise<string> {
    if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
      return storageKey;
    }

    if (this.enabled && storageKey.startsWith('nexora/')) {
      return `https://res.cloudinary.com/${this.cloudName}/auto/upload/${storageKey}`;
    }

    return this.localFallback.getSecureUrl(storageKey, expiresInSeconds);
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    if (this.enabled && storageKey.startsWith('nexora/')) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const paramsToSign = `public_id=${storageKey}&timestamp=${timestamp}${this.apiSecret}`;
        const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

        const formData = new FormData();
        formData.append('public_id', storageKey);
        formData.append('api_key', this.apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`, {
          method: 'POST',
          body: formData,
        });

        return res.ok;
      } catch (e) {
        return false;
      }
    }

    return this.localFallback.deleteFile(storageKey);
  }
}
