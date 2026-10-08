import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IStorageService, STORAGE_SERVICE_TOKEN } from '../storage/storage.interface';
import { DefaultDocumentProcessorService } from './processors/default-document-processor.service';
import {
  DocumentStatus,
  DocumentType,
  SourceType,
  VerificationStatus,
} from '../common/enums';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  private readonly allowedMimes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE_TOKEN)
    private readonly storageService: IStorageService,
    private readonly documentProcessor: DefaultDocumentProcessorService,
  ) {}

  async uploadDocument(
    applicantId: string,
    file: Express.Multer.File,
    documentType: DocumentType,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed types: PDF, PNG, JPG, DOC, DOCX`,
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 25MB limit');
    }

    const uploadResult = await this.storageService.uploadFile(
      applicantId,
      'documents',
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    const doc = await this.prisma.document.create({
      data: {
        applicantId,
        documentType,
        filename: uploadResult.filename,
        storageKey: uploadResult.storageKey,
        fileSize: BigInt(uploadResult.fileSize),
        mimeType: uploadResult.mimeType,
        status: DocumentStatus.UPLOADED,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: applicantId,
        action: 'DOCUMENT_UPLOAD',
        entityType: 'DOCUMENT',
        entityId: doc.id,
        details: { filename: doc.filename, type: doc.documentType },
      },
    });

    // Auto-trigger analysis in background
    this.analyzeDocument(doc.id, applicantId).catch((err) => {
      this.logger.error(`Background analysis failed for document ${doc.id}: ${err.message}`);
    });

    return {
      ...doc,
      fileSize: Number(doc.fileSize),
    };
  }

  async analyzeDocument(documentId: string, applicantId: string): Promise<any> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { extraction: true },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (doc.applicantId !== applicantId) {
      throw new ForbiddenException('Cannot access documents of another applicant');
    }

    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: DocumentStatus.EXTRACTING, processingError: null },
    });

    try {
      const buffer = await this.storageService.getFileBuffer(doc.storageKey);
      const result = await this.documentProcessor.processDocument(buffer, doc.mimeType, doc.filename);

      const extraction = await this.prisma.documentExtraction.upsert({
        where: { documentId: doc.id },
        create: {
          documentId: doc.id,
          rawText: result.rawText,
          extractedJson: result.structuredData,
          confidence: result.confidence,
          warnings: result.warnings,
          provenance: {
            extractedAt: new Date().toISOString(),
            extractor: 'NexoraDocumentAgent',
            originalFilename: doc.filename,
          },
        },
        update: {
          rawText: result.rawText,
          extractedJson: result.structuredData,
          confidence: result.confidence,
          warnings: result.warnings,
          provenance: {
            extractedAt: new Date().toISOString(),
            extractor: 'NexoraDocumentAgent',
            originalFilename: doc.filename,
          },
        },
      });

      await this.prisma.document.update({
        where: { id: doc.id },
        data: { status: DocumentStatus.COMPLETED, processingError: null },
      });

      // Map proposed extractions to Profile with genuine provenance
      await this.proposeProfileUpdatesFromExtraction(applicantId, doc, result);

      return extraction;
    } catch (err: any) {
      await this.prisma.document.update({
        where: { id: doc.id },
        data: {
          status: DocumentStatus.FAILED,
          processingError: err.message || 'Unable to process this document.',
        },
      });
      throw err;
    }
  }

  async getDocuments(applicantId: string): Promise<any[]> {
    const docs = await this.prisma.document.findMany({
      where: { applicantId },
      include: { extraction: true },
      orderBy: { createdAt: 'desc' },
    });

    return docs.map((doc) => ({
      ...doc,
      fileSize: Number(doc.fileSize),
    }));
  }

  async getDocumentById(documentId: string, applicantId: string): Promise<any> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { extraction: true },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (doc.applicantId !== applicantId) {
      throw new ForbiddenException('Unauthorized access to document');
    }

    return {
      ...doc,
      fileSize: Number(doc.fileSize),
    };
  }

  async deleteDocument(documentId: string, applicantId: string): Promise<{ success: boolean }> {
    const doc = await this.getDocumentById(documentId, applicantId);
    await this.storageService.deleteFile(doc.storageKey);

    await this.prisma.document.delete({
      where: { id: documentId },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: applicantId,
        action: 'DOCUMENT_DELETE',
        entityType: 'DOCUMENT',
        entityId: documentId,
      },
    });

    return { success: true };
  }

  private async proposeProfileUpdatesFromExtraction(
    applicantId: string,
    doc: any,
    result: any,
  ) {
    const profile = await this.prisma.applicantProfile.findUnique({ where: { userId: applicantId } });
    if (!profile) return;

    const data = result.structuredData || {};

    // If degree / transcript: add Education record with genuine provenance (NEVER INVENTED)
    if (doc.documentType === DocumentType.DEGREE || doc.documentType === DocumentType.TRANSCRIPT) {
      if (data.institution && data.degree) {
        await this.prisma.education.create({
          data: {
            profileId: profile.id,
            institution: data.institution,
            degree: data.degree,
            fieldOfStudy: data.field || data.fieldOfStudy || 'Not provided',
            graduationDate: data.graduationDate || null,
            gradeOrCgpa: data.marks || data.gradeOrCgpa || null,
            sourceType: SourceType.DOCUMENT_EXTRACTED,
            sourceId: doc.id,
            confidence: result.confidence || 0.9,
            verificationStatus: VerificationStatus.PENDING,
          },
        });
      }
    }

    // If language certificate: add Language record with genuine provenance (NEVER INVENTED)
    if (doc.documentType === DocumentType.LANGUAGE_CERTIFICATE) {
      if (data.language && data.level) {
        await this.prisma.language.create({
          data: {
            profileId: profile.id,
            language: data.language,
            proficiencyLevel: data.level,
            certificateType: data.certificateType || null,
            certificateNumber: data.certificateNumber || null,
            sourceType: SourceType.DOCUMENT_EXTRACTED,
            sourceId: doc.id,
            confidence: result.confidence || 0.9,
            verificationStatus: VerificationStatus.PENDING,
          },
        });
      }
    }
  }
}
