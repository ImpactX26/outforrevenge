import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to PostgreSQL database...');
    await this.$connect();
    this.logger.log('Connected to PostgreSQL database successfully.');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from PostgreSQL database...');
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL database.');
  }
}
