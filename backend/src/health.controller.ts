import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('api')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('health')
  @ApiOperation({ summary: 'Application health and database connectivity check' })
  async getHealth() {
    const isDbConnected = this.dataSource.isInitialized;
    return {
      status: 'ok',
      product: 'Nexora',
      tagline: 'Your intelligent journey to Germany.',
      timestamp: new Date().toISOString(),
      database: isDbConnected ? 'connected' : 'disconnected',
    };
  }
}
