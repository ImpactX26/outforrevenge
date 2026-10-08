export interface ProcessedDocumentResult {
  rawText: string;
  structuredData: Record<string, any>;
  confidence: number;
  warnings: string[];
  documentType: string;
}

export interface IDocumentProcessor {
  processDocument(
    buffer: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<ProcessedDocumentResult>;
}

export const DOCUMENT_PROCESSOR_TOKEN = 'IDocumentProcessor';
