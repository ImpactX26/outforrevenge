import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DefaultDocumentProcessorService } from './processors/default-document-processor.service';
import { DOCUMENT_PROCESSOR_TOKEN } from './processors/document-processor.interface';

@Module({
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
