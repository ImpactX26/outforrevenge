import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LocalStorageService } from './local-storage.service';
import { UserRole } from '../common/enums';

@ApiTags('Storage')
@Controller('api/storage')
export class StorageController {
  constructor(private readonly storageService: LocalStorageService) {}

  @Get('file')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stream secure file from object storage' })
  async getFile(
    @Query('key') storageKey: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    if (!storageKey) {
      throw new NotFoundException('Storage key is required');
    }

    // Ownership check: applicant can only access files under nexora/applicants/{user.id}/
    if (user.role === UserRole.APPLICANT) {
      const applicantPrefix = `nexora/applicants/${user.id}/`;
      if (!storageKey.startsWith(applicantPrefix)) {
        throw new ForbiddenException('You do not have permission to access this file');
      }
    }

    const stream = await this.storageService.getFileStream(storageKey);
    stream.pipe(res);
  }
}
