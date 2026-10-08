import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../database/entities/document.entity';
import { DocumentExtraction } from '../database/entities/document-extraction.entity';
import { ApplicantProfile } from '../database/entities/applicant-profile.entity';
import { Education } from '../database/entities/education.entity';
import { Language } from '../database/entities/language.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { LocalStorageService } from '../storage/local-storage.service';
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
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    @InjectRepository(DocumentExtraction)
    private readonly extractionRepo: Repository<DocumentExtraction>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepo: Repository<ApplicantProfile>,
    @InjectRepository(Education)
    private readonly educationRepo: Repository<Education>,
    @InjectRepository(Language)
    private readonly languageRepo: Repository<Language>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly storageService: LocalStorageService,
    private readonly documentProcessor: DefaultDocumentProcessorService,
  ) {}

  async uploadDocument(
    applicantId: string,
    file: Express.Multer.File,
    documentType: DocumentType,
  ): Promise<Document> {
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

    const doc = this.documentRepo.create({
      applicantId,
      documentType,
      filename: uploadResult.filename,
      storageKey: uploadResult.storageKey,
      fileSize: uploadResult.fileSize,
      mimeType: uploadResult.mimeType,
      status: DocumentStatus.UPLOADED,
    });

    const savedDoc = await this.documentRepo.save(doc);

    await this.auditRepo.save(
      this.auditRepo.create({
        userId: applicantId,
        action: 'DOCUMENT_UPLOAD',
        entityType: 'DOCUMENT',
        entityId: savedDoc.id,
        details: { filename: savedDoc.filename, type: savedDoc.documentType },
      }),
    );

    // Auto-trigger analysis
    this.analyzeDocument(savedDoc.id, applicantId).catch((err) => {
      this.logger.error(`Background analysis failed for document ${savedDoc.id}: ${err.message}`);
    });

    return savedDoc;
  }

  async analyzeDocument(documentId: string, applicantId: string): Promise<DocumentExtraction> {
    const doc = await this.documentRepo.findOne({
      where: { id: documentId },
      relations: ['extraction'],
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (doc.applicantId !== applicantId) {
      throw new ForbiddenException('Cannot access documents of another applicant');
    }

    doc.status = DocumentStatus.EXTRACTING;
    await this.documentRepo.save(doc);

    try {
      const buffer = await this.storageService.getFileBuffer(doc.storageKey);
      const result = await this.documentProcessor.processDocument(buffer, doc.mimeType, doc.filename);

      let extraction = doc.extraction;
      if (!extraction) {
        extraction = this.extractionRepo.create({
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
        });
      } else {
        extraction.rawText = result.rawText;
        extraction.extractedJson = result.structuredData;
        extraction.confidence = result.confidence;
        extraction.warnings = result.warnings;
      }

      const savedExtraction = await this.extractionRepo.save(extraction);

      doc.status = DocumentStatus.COMPLETED;
      await this.documentRepo.save(doc);

      // Map proposed extractions to Profile with proper provenance
      await this.proposeProfileUpdatesFromExtraction(applicantId, doc, result);

      return savedExtraction;
    } catch (err) {
      doc.status = DocumentStatus.FAILED;
      doc.processingError = err.message;
      await this.documentRepo.save(doc);
      throw err;
    }
  }

  async getDocuments(applicantId: string): Promise<Document[]> {
    return this.documentRepo.find({
      where: { applicantId },
      relations: ['extraction'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDocumentById(documentId: string, applicantId: string): Promise<Document> {
    const doc = await this.documentRepo.findOne({
      where: { id: documentId },
      relations: ['extraction'],
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (doc.applicantId !== applicantId) {
      throw new ForbiddenException('Unauthorized access to document');
    }

    return doc;
  }

  async deleteDocument(documentId: string, applicantId: string): Promise<{ success: boolean }> {
    const doc = await this.getDocumentById(documentId, applicantId);
    await this.storageService.deleteFile(doc.storageKey);
    await this.documentRepo.remove(doc);

    await this.auditRepo.save(
      this.auditRepo.create({
        userId: applicantId,
        action: 'DOCUMENT_DELETE',
        entityType: 'DOCUMENT',
        entityId: documentId,
      }),
    );

    return { success: true };
  }

  private async proposeProfileUpdatesFromExtraction(
    applicantId: string,
    doc: Document,
    result: any,
  ) {
    const profile = await this.profileRepo.findOne({ where: { userId: applicantId } });
    if (!profile) return;

    const data = result.structuredData || {};

    // If degree / transcript: add Education record with provenance
    if (doc.documentType === DocumentType.DEGREE || doc.documentType === DocumentType.TRANSCRIPT) {
      if (data.institution || data.degree) {
        const edu = this.educationRepo.create({
          profileId: profile.id,
          institution: data.institution || 'Recognized Indian University',
          degree: data.degree || 'Bachelor Degree',
          fieldOfStudy: data.field || 'Engineering / Sciences',
          graduationDate: data.graduationDate || '2024',
          gradeOrCgpa: data.marks || data.gradeOrCgpa || 'First Class',
          sourceType: SourceType.DOCUMENT_EXTRACTED,
          sourceId: doc.id,
          confidence: result.confidence,
          verificationStatus: VerificationStatus.PENDING,
        });
        await this.educationRepo.save(edu);
      }
    }

    // If language certificate: add Language record with provenance
    if (doc.documentType === DocumentType.LANGUAGE_CERTIFICATE) {
      const lang = this.languageRepo.create({
        profileId: profile.id,
        language: data.language || 'German',
        proficiencyLevel: data.level || 'B1',
        certificateType: data.certificateType || 'Goethe-Zertifikat',
        certificateNumber: data.certificateNumber || null,
        sourceType: SourceType.DOCUMENT_EXTRACTED,
        sourceId: doc.id,
        confidence: result.confidence,
        verificationStatus: VerificationStatus.PENDING,
      });
      await this.languageRepo.save(lang);
    }
  }
}
