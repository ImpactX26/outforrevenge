import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import {
  IDocumentProcessor,
  ProcessedDocumentResult,
} from './document-processor.interface';
import { AiService } from '../../ai/ai.service';

@Injectable()
export class DefaultDocumentProcessorService implements IDocumentProcessor {
  private readonly logger = new Logger(DefaultDocumentProcessorService.name);

  constructor(private readonly aiService: AiService) {}

  async processDocument(
    buffer: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<ProcessedDocumentResult> {
    let rawText = '';
    const warnings: string[] = [];

    if (mimeType === 'application/pdf') {
      try {
        const parsed = await pdfParse(buffer);
        rawText = parsed.text ? parsed.text.trim() : '';
      } catch (err: any) {
        this.logger.warn(`pdf-parse failed on ${filename}: ${err.message}`);
        throw new BadRequestException(`Unable to parse PDF text layer for ${filename}: ${err.message}`);
      }
    } else if (
      mimeType === 'application/msword' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // DOC/DOCX basic text extract or UTF-8 text representation
      rawText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
    } else {
      // Image file (PNG/JPG/JPEG) without OCR provider configured
      // We strictly do NOT pretend OCR ran.
      throw new BadRequestException(
        `Unable to process scanned document/image "${filename}". An external OCR engine is required for image files. Please upload a digital PDF with a selectable text layer.`,
      );
    }

    if (!rawText || rawText.length < 15) {
      // Scanned PDF with no extractable text layer
      throw new BadRequestException(
        `Unable to process this document. Scanned PDF "${filename}" contains no extractable text layer. Please upload a searchable digital PDF or OCR-enabled document.`,
      );
    }

    // Call Document Extraction Agent via AiService
    const prompt = `Extract structured applicant details from the following document text.
Return ONLY verified fields present in the text. Do NOT invent institutions, degrees, or marks.
Filename: ${filename}
MimeType: ${mimeType}
Document Raw Text:
"""
${rawText.slice(0, 5000)}
"""`;

    // Must call AI service. If call fails, do not invent data; fail with clear message.
    const agentResult = await this.aiService.runAgentStructured<any>(
      'DOCUMENT',
      undefined,
      prompt,
    );

    if (!agentResult || !agentResult.data) {
      throw new BadRequestException('Document analysis AI provider failed to return structured data.');
    }

    const data = agentResult.data;

    return {
      rawText,
      structuredData: data?.fields || data || {},
      confidence: typeof data?.confidence === 'number' ? data.confidence : 0.9,
      warnings: [...warnings, ...(data?.warnings || [])],
      documentType: data?.documentType || 'DEGREE',
    };
  }
}
