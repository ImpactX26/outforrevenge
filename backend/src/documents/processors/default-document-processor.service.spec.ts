import { BadRequestException } from '@nestjs/common';
import { DefaultDocumentProcessorService } from './default-document-processor.service';

const mockPdfParse = jest.fn();
jest.mock('pdf-parse', () => {
  return (...args: any[]) => mockPdfParse(...args);
});

describe('DefaultDocumentProcessorService (Genuine Extraction & Zero-Placeholder Verification)', () => {
  let service: DefaultDocumentProcessorService;
  let mockAiService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiService = {
      runAgentStructured: jest.fn().mockResolvedValue({
        data: {
          documentType: 'DEGREE',
          fields: {
            institution: 'Indian Institute of Technology Bombay',
            degree: 'Bachelor of Technology',
            marks: '8.8 CGPA',
          },
          confidence: 0.95,
        },
      }),
    };

    service = new DefaultDocumentProcessorService(mockAiService as any);
  });

  it('CRITICAL: Empty buffer throws BadRequestException', async () => {
    await expect(
      service.processDocument(Buffer.alloc(0), 'application/pdf', 'degree.pdf'),
    ).rejects.toThrow(BadRequestException);
  });

  it('CRITICAL: Unsupported document MIME type throws BadRequestException', async () => {
    await expect(
      service.processDocument(Buffer.from('executable binary code'), 'application/x-msdownload', 'virus.exe'),
    ).rejects.toThrow(BadRequestException);
  });

  it('DOCX parsing invokes mammoth and extracts actual text', async () => {
    const mammoth = require('mammoth');
    const spy = jest.spyOn(mammoth, 'extractRawText').mockResolvedValue({
      value: 'Curriculum Vitae: Experienced Full Stack Software Engineer specializing in TypeScript and React.',
      messages: [],
    });

    try {
      const result = await service.processDocument(
        Buffer.from('fake-docx-binary'),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'resume.docx',
      );

      expect(spy).toHaveBeenCalled();
      expect(result.rawText).toContain('Experienced Full Stack Software Engineer');
      expect(mockAiService.runAgentStructured).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('Valid PDF extracts embedded text layer and forwards to AI extractor', async () => {
    mockPdfParse.mockResolvedValueOnce({
      text: 'Transcript of Records: Bachelor of Engineering in Computer Science. CGPA: 8.5',
    });

    const result = await service.processDocument(
      Buffer.from('pdf-binary-data'),
      'application/pdf',
      'transcript.pdf',
    );

    expect(result.rawText).toContain('Transcript of Records');
    expect(mockAiService.runAgentStructured).toHaveBeenCalled();
  });

  it('CRITICAL: Blank scanned PDF throws BadRequestException without sending placeholder to LLM', async () => {
    mockPdfParse.mockResolvedValueOnce({ text: '   ' });

    await expect(
      service.processDocument(Buffer.from('blank-pdf-data'), 'application/pdf', 'scanned_blank.pdf'),
    ).rejects.toThrow(BadRequestException);

    // Verify AI extractor was NEVER called with placeholder description
    expect(mockAiService.runAgentStructured).not.toHaveBeenCalled();
  });
});
