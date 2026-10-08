import { Module } from '@nestjs/common';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';
import { PdfGeneratorService } from './pdf-generator.service';

@Module({
  controllers: [CvController],
  providers: [CvService, PdfGeneratorService],
  exports: [CvService, PdfGeneratorService],
})
export class CvModule {}
