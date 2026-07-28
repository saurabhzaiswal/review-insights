import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { EnvironmentVariables } from '../config/environment';

/**
 * Owns the application's only Prisma connection pool.
 *
 * Feature services should inject this provider instead of constructing clients;
 * multiple clients can exhaust PostgreSQL connections during development reloads.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService<EnvironmentVariables, true>) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL', { infer: true }),
        },
      },
      errorFormat: 'minimal',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
