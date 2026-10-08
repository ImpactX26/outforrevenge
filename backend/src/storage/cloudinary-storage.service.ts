import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IStorageService, StorageUploadResult } from './storage.interface';
import { LocalStorageService } from './local-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { Readable } from 'stream';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class CloudinaryStorageService implements IStorageService {
  private readonly logger = new Logger(CloudinaryStorageService.name);
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly enabled: boolean;

  private readonly allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.mp4'];
  private readonly allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'video/mp4',
  ];

  constructor(
    private readonly localFallback: LocalStorageService,
    private readonly prisma: PrismaService,
  ) {
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
      this.logger.log('Cloudinary credentials not provided or partial. Local fallback ready.');
    }
  }

  async uploadFile(
    applicantId: string,
    category: 'documents' | 'videos' | 'cv' | 'cover-letters',
    filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<StorageUploadResult> {
    // 1. Strict validation of extension, MIME, size and dangerous types
    this.validateFile(filename, mimeType, buffer);

    const safeApplicant = applicantId.replace(/[^a-zA-Z0-9_-]/g, '');
    const folder = `nexora/applicants/${safeApplicant}/${category}`;
    const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const publicId = `${folder}/${Date.now()}_${cleanName}`;
    const ext = path.extname(filename).replace('.', '').toLowerCase() || 'bin';
    const resourceType = mimeType.startsWith('video/') ? 'video' : mimeType.startsWith('image/') ? 'image' : 'raw';

    if (!this.enabled) {
      const localRes = await this.localFallback.uploadFile(applicantId, category, filename, buffer, mimeType);
      await this.saveFileAssetMetadata(
        localRes.storageKey,
        resourceType,
        ext,
        filename,
        localRes.fileSize,
        applicantId,
        localRes.url,
      );
      return localRes;
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);

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

      const targetResourceType = resourceType === 'raw' ? 'raw' : resourceType === 'video' ? 'video' : 'auto';
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${targetResourceType}/upload`;

      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Cloudinary upload failed (${res.status}): ${errorText}`);
      }

      const data: any = await res.json();
      const finalPublicId = data.public_id || publicId;
      const finalUrl = data.secure_url || data.url;
      const fileSize = data.bytes || buffer.length;

      // Store metadata in PostgreSQL FileAsset table
      await this.saveFileAssetMetadata(
        finalPublicId,
        data.resource_type || resourceType,
        data.format || ext,
        filename,
        fileSize,
        applicantId,
        finalUrl,
      );

      return {
        storageKey: finalPublicId,
        filename,
        fileSize,
        mimeType,
        url: finalUrl,
      };
    } catch (err: any) {
      this.logger.warn(`Cloudinary upload attempt failed: ${err.message}. Retrying with local fallback.`);
      const localRes = await this.localFallback.uploadFile(applicantId, category, filename, buffer, mimeType);
      await this.saveFileAssetMetadata(
        localRes.storageKey,
        resourceType,
        ext,
        filename,
        localRes.fileSize,
        applicantId,
        localRes.url,
      );
      return localRes;
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
      const secureUrl = await this.getSecureUrl(storageKey);
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
      // Authenticated signed delivery URL
      const timestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
      const toSign = `public_id=${storageKey}&timestamp=${timestamp}${this.apiSecret}`;
      const sig = crypto.createHash('sha1').update(toSign).digest('hex').slice(0, 16);
      return `https://res.cloudinary.com/${this.cloudName}/auto/upload/s--${sig}--/${storageKey}`;
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

        await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`, {
          method: 'POST',
          body: formData,
        });
      } catch (e) {
        // continue
      }
    }

    // Also remove metadata from PostgreSQL
    try {
      await this.prisma.fileAsset.deleteMany({
        where: { publicId: storageKey },
      });
    } catch (e) {
      // ignore
    }

    return this.localFallback.deleteFile(storageKey);
  }

  private validateFile(filename: string, mimeType: string, buffer: Buffer): void {
    const ext = path.extname(filename).toLowerCase();

    if (!this.allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Disallowed file extension "${ext}". Allowed formats: PDF, DOC, DOCX, JPG, JPEG, PNG, MP4`,
      );
    }

    const cleanMime = mimeType.toLowerCase();
    if (!this.allowedMimes.includes(cleanMime)) {
      throw new BadRequestException(
        `Disallowed MIME type "${cleanMime}". Allowed formats: PDF, DOC, DOCX, JPG, JPEG, PNG, MP4`,
      );
    }

    // Dangerous extension check
    const dangerous = ['.exe', '.sh', '.bat', '.cmd', '.js', '.vbs', '.py', '.php', '.bin'];
    if (dangerous.some((d) => filename.toLowerCase().endsWith(d))) {
      throw new BadRequestException('Dangerous executable or script file detected.');
    }

    // Size limit: 100MB max
    if (buffer.length > 100 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds the 100MB limit.');
    }
  }

  private async saveFileAssetMetadata(
    publicId: string,
    resourceType: string,
    format: string,
    filename: string,
    size: number,
    reference: string,
    secureUrl?: string,
  ): Promise<void> {
    try {
      await this.prisma.fileAsset.upsert({
        where: { publicId },
        create: {
          publicId,
          resourceType,
          format,
          filename,
          size: BigInt(size),
          reference,
          status: 'UPLOADED',
          secureUrl,
        },
        update: {
          resourceType,
          format,
          filename,
          size: BigInt(size),
          reference,
          status: 'UPLOADED',
          secureUrl,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Could not persist FileAsset metadata: ${err.message}`);
    }
  }
}
