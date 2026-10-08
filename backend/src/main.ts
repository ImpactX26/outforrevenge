import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

process.on('uncaughtException', (err: any) => {
  const msg = err?.message || '';
  if (
    err?.code === 'ECONNRESET' ||
    msg.includes('ECONNRESET') ||
    msg.includes('Connection terminated unexpectedly') ||
    msg.includes('socket hang up')
  ) {
    // Neon cloud connection pooler drops idle sockets; pg connection pool auto-reconnects on next query
    return;
  }
  console.error('Uncaught Exception:', err);
});

async function bootstrap() {
  const logger = new Logger('NexoraBootstrap');

  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl) {
    logger.log(`Connecting to PostgreSQL via Prisma: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);
  }

  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS whitelist
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Dev flexible origin
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Nexora')
    .setDescription('Nexora API Documentation — Your intelligent journey to Germany (Educaro Deutschland GmbH)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Applicant')
    .addTag('AI')
    .addTag('Documents')
    .addTag('Videos')
    .addTag('Qualification')
    .addTag('Opportunities')
    .addTag('Recommendations')
    .addTag('Journey')
    .addTag('CV')
    .addTag('Cover Letter')
    .addTag('Interview')
    .addTag('Consultant')
    .addTag('Admin')
    .addTag('Storage')
    .addTag('Notifications')
    .addTag('Health')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Nexora API Documentation',
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Nexora backend successfully listening on http://localhost:${port}`);
  logger.log(`OpenAPI Swagger documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
