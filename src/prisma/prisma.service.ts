import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    console.log('PrismaService initializing...');

    // Explicitly set connection pool limits for serverless/limited environments
    // and increase timeout
    const pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 30000, // 30s for remote DB
      idleTimeoutMillis: 30000,
      max: 5,
    });

    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
