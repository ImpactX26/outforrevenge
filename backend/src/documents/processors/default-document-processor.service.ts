import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
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
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException(`Document buffer is empty for ${filename}.`);
    }

    let rawText = '';
    const warnings: string[] = [];

    // 1. PDF Documents: Extract embedded text layer
    if (mimeType === 'application/pdf') {
      try {
        const parsed = await pdfParse(buffer);
        rawText = parsed.text ? parsed.text.trim() : '';
      } catch (err: any) {
        this.logger.warn(`pdf-parse failed on ${filename}: ${err.message}`);
      }

      if (!rawText || rawText.length < 15) {
        throw new BadRequestException(
          `Unable to extract machine-readable text from ${filename}. The PDF appears to be a scanned document without an embedded text layer. Please upload a clear image (PNG/JPG) or a text-embedded PDF.`,
        );
      }
    }
    // 2. Microsoft Word DOCX: Extract actual document text via mammoth
    else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value ? result.value.trim() : '';
        if (result.messages && result.messages.length > 0) {
          result.messages.forEach((m) => warnings.push(m.message));
        }
      } catch (err: any) {
        this.logger.error(`Mammoth DOCX extraction failed on ${filename}: ${err.message}`);
        throw new BadRequestException(
          `Failed to parse Word document ${filename}: ${err.message}. Please verify the file is not corrupted or password-protected.`,
        );
      }

      if (!rawText || rawText.length < 10) {
        throw new BadRequestException(
          `Document ${filename} contains no readable text content. Please provide a document with valid text.`,
        );
      }
    }
    // 3. Image Files (PNG, JPG, JPEG, WEBP): Real OCR and Vision extraction
    else if (
      mimeType.startsWith('image/') ||
      mimeType === 'image/png' ||
      mimeType === 'image/jpeg' ||
      mimeType === 'image/jpg' ||
      mimeType === 'image/webp'
    ) {
      rawText = await this.performImageOcr(buffer, filename, mimeType);

      if (!rawText || rawText.length < 10) {
        throw new BadRequestException(
          `Unable to extract legible text from image ${filename}. Please upload a higher-resolution, well-lit scan of the document.`,
        );
      }
      warnings.push('Document processed via optical character recognition (OCR).');
    } else {
      throw new BadRequestException(
        `Unsupported document format: ${mimeType}. Please upload a PDF, DOCX, or PNG/JPEG image.`,
      );
    }

    // 4. Send genuine extracted text to Document AI Extractor
    const prompt = `Extract structured applicant details from the following verified document text.
Return ONLY verified fields present in the text. Do NOT invent institutions, degrees, grades, or dates.
If a field is not present in the text, omit it or set it to null.
Filename: ${filename}
MimeType: ${mimeType}
Document Raw Text:
"""
${rawText.slice(0, 8000)}
"""`;

    const agentResult = await this.aiService.runAgentStructured<any>(
      'DOCUMENT',
      undefined,
      prompt,
    );

    if (!agentResult || !agentResult.data) {
      throw new BadRequestException(
        `Document analysis AI provider failed to return structured data for ${filename}.`,
      );
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

  private async performImageOcr(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY || process.env.AI_PROVIDER_API_KEY;

    // Strategy A: If Groq Vision API is available, use fast multimodal vision extraction
    if (apiKey) {
      try {
        const base64Image = buffer.toString('base64');
        const visionResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.2-11b-vision-preview',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Transcribe all visible text from this certificate/document image verbatim and completely. Return ONLY the transcribed text without conversational preface or commentary.',
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${mimeType};base64,${base64Image}`,
                    },
                  },
                ],
              },
            ],
            temperature: 0.1,
          }),
        });

        if (visionResponse.ok) {
          const visionData: any = await visionResponse.json();
          const extractedText = visionData?.choices?.[0]?.message?.content?.trim();
          if (extractedText && extractedText.length >= 10) {
            this.logger.log(`Successfully extracted ${extractedText.length} characters via Groq Vision for ${filename}`);
            return extractedText;
          }
        } else {
          const errText = await visionResponse.text();
          this.logger.warn(`Groq Vision OCR failed (${visionResponse.status}): ${errText}`);
        }
      } catch (visionErr: any) {
        this.logger.warn(`Groq Vision exception for ${filename}: ${visionErr.message}`);
      }
    }

    // Strategy B: Fallback to local Tesseract.js OCR engine
    try {
      this.logger.log(`Running Tesseract.js OCR for ${filename}`);
      const { createWorker } = require('tesseract.js');
      const worker = await createWorker('eng');
      try {
        const ret = await worker.recognize(buffer);
        const ocrText = (ret?.data?.text || '').trim();
        if (ocrText && ocrText.length >= 10) {
          return ocrText;
        }
      } finally {
        await worker.terminate().catch(() => {});
      }
    } catch (tesseractErr: any) {
      this.logger.warn(`Tesseract OCR failed for ${filename}: ${tesseractErr?.message || String(tesseractErr)}`);
    }

    return '';
  }
}
