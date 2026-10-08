import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private keepAliveTimer: NodeJS.Timeout | null = null;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to PostgreSQL database...');
    await this.$connect();
    this.logger.log('Connected to PostgreSQL database successfully.');

    // Keep Neon cloud connection pool warm with periodic heartbeat ping
    this.keepAliveTimer = setInterval(async () => {
      try {
        await this.$queryRawUnsafe('SELECT 1');
      } catch (err: any) {
        // Pooler will reconnect on next query
      }
    }, 120_000); // every 2 minutes
  }

  async onModuleDestroy() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    this.logger.log('Disconnecting from PostgreSQL database...');
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL database.');
  }
}
