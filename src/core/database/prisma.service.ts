import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { LoggerService } from '../../shared/logger/logger.service';

function parseDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: parsed.username,
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
    };
  } catch (e) {
    const regex = /^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
    const match = url.match(regex);
    if (!match) throw new Error('Invalid DATABASE_URL format');
    return {
      user: match[1],
      password: decodeURIComponent(match[2]),
      host: match[3],
      port: parseInt(match[4], 10),
      database: match[5],
    };
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService
  ) {
    const dbUrl = configService.get<string>('app.database.url') || process.env.DATABASE_URL || '';
    const dbConfig = parseDatabaseUrl(dbUrl);

    const adapter = new PrismaMariaDb({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      connectionLimit: 10,
    });

    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    // Register query logger to performance logger
    (this as any).$on('query', (e: any) => {
      this.logger.performance(`DB QUERY`, e.duration, {
        query: e.query,
        params: e.params,
      });
    });

    (this as any).$on('info', (e: any) => {
      this.logger.log(e.message, 'Database');
    });

    (this as any).$on('warn', (e: any) => {
      this.logger.warn(e.message, 'Database');
    });

    (this as any).$on('error', (e: any) => {
      this.logger.error(e.message, undefined, 'Database');
    });

    try {
      await this.$connect();
      this.logger.log('Connected to MySQL Database via Prisma 7 Driver Adapter', 'Database');
    } catch (error) {
      this.logger.error('Failed to connect to MySQL Database', error.stack, 'Database');
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from MySQL Database', 'Database');
  }

  /**
   * Helper method for transaction handling.
   * Can be extended in the future for multi-tenant database routing.
   */
  async runInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.$transaction(fn);
  }
}
