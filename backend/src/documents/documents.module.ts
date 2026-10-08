import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DefaultDocumentProcessorService } from './processors/default-document-processor.service';
import { DOCUMENT_PROCESSOR_TOKEN } from './processors/document-processor.interface';
import {
  Document,
  DocumentExtraction,
  ApplicantProfile,
  Education,
  Language,
  AuditLog,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Document,
      DocumentExtraction,
      ApplicantProfile,
      Education,
      Language,
      AuditLog,
    ]),
  ],
  controllers: [DocumentsController],
  providers: [
    DefaultDocumentProcessorService,
    {
      provide: DOCUMENT_PROCESSOR_TOKEN,
      useClass: DefaultDocumentProcessorService,
    },
    DocumentsService,
  ],
  exports: [DocumentsService, DOCUMENT_PROCESSOR_TOKEN],
})
export class DocumentsModule {}
