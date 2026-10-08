import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DocumentType } from '../common/enums';

@ApiTags('Documents')
@Controller('api/documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an applicant document' })
  async upload(
    @CurrentUser('id') applicantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: DocumentType,
  ) {
    if (!documentType) {
      documentType = DocumentType.OTHER;
    }
    const doc = await this.documentsService.uploadDocument(applicantId, file, documentType);
    return {
      success: true,
      document: doc,
    };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an applicant document (alias)' })
  async uploadAlias(
    @CurrentUser('id') applicantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: DocumentType,
  ) {
    if (!documentType) {
      documentType = DocumentType.OTHER;
    }
    const doc = await this.documentsService.uploadDocument(applicantId, file, documentType);
    return {
      success: true,
      document: doc,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents uploaded by current applicant' })
  async list(@CurrentUser('id') applicantId: string) {
    const documents = await this.documentsService.getDocuments(applicantId);
    return {
      success: true,
      documents,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single document with extraction details' })
  async getOne(
    @CurrentUser('id') applicantId: string,
    @Param('id') documentId: string,
  ) {
    const document = await this.documentsService.getDocumentById(documentId, applicantId);
    return {
      success: true,
      document,
    };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download or stream raw document binary' })
  async download(
    @CurrentUser('id') applicantId: string,
    @Param('id') documentId: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType, filename } = await this.documentsService.getDocumentBuffer(documentId, applicantId);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  @Post(':id/analyze')
  @ApiOperation({ summary: 'Trigger AI document extraction' })
  async analyze(
    @CurrentUser('id') applicantId: string,
    @Param('id') documentId: string,
  ) {
    const extraction = await this.documentsService.analyzeDocument(documentId, applicantId);
    return {
      success: true,
      extraction,
    };
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry document extraction' })
  async retry(
    @CurrentUser('id') applicantId: string,
    @Param('id') documentId: string,
  ) {
    const extraction = await this.documentsService.analyzeDocument(documentId, applicantId);
    return {
      success: true,
      extraction,
    };
  }

  @Post(':id/re-extract')
  @ApiOperation({ summary: 'Re-extract document credentials (alias)' })
  async reExtract(
    @CurrentUser('id') applicantId: string,
    @Param('id') documentId: string,
  ) {
    const extraction = await this.documentsService.analyzeDocument(documentId, applicantId);
    return {
      success: true,
      extraction,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  async delete(
    @CurrentUser('id') applicantId: string,
    @Param('id') documentId: string,
  ) {
    return this.documentsService.deleteDocument(documentId, applicantId);
  }
}
