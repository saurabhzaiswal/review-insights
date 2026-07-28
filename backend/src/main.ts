import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { EnvironmentVariables, parseCorsOrigins } from './config/environment';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService<EnvironmentVariables, true>);
  const logger = new Logger('Bootstrap');
  const port = config.get('PORT', { infer: true });
  const appName = config.get('APP_NAME', { infer: true });
  const appVersion = config.get('APP_VERSION', { infer: true });
  const corsOrigins = parseCorsOrigins(config.get('CORS_ORIGINS', { infer: true }));

  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
  app.use(helmet());
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 86400,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle(appName)
    .setDescription('Operations API for Azzurro Hotels guest review analytics.')
    .setVersion(appVersion)
    .addTag('Health')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    customSiteTitle: `${appName} documentation`,
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port, '0.0.0.0');
  logger.log(`${appName} is running on http://localhost:${port}/api`);
  logger.log(`Swagger is available at http://localhost:${port}/api/docs`);
}

void bootstrap();
