import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private isOffline = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService
  ) {}

  onModuleInit() {
    const host = this.configService.get<string>('app.redis.host');
    const port = this.configService.get<number>('app.redis.port');
    const isDev = this.configService.get<string>('app.nodeEnv') === 'development';

    this.redisClient = new Redis({
      host,
      port,
      lazyConnect: true,
      maxRetriesPerRequest: isDev ? 1 : null,
      retryStrategy: (times) => {
        if (isDev && times > 2) {
          this.isOffline = true;
          return null; // Stop retrying in development
        }
        return Math.min(times * 50, 2000);
      },
    });

    this.redisClient.on('connect', () => {
      this.isOffline = false;
      this.logger.log('Connected to Redis Cache Server', 'Cache');
    });

    let hasLoggedWarning = false;
    this.redisClient.on('error', (err) => {
      if (isDev) {
        if (!hasLoggedWarning) {
          this.logger.warn(
            `Redis Cache Server is offline or unavailable. Operating in fallback cache mode. Error: ${err.message}`,
            'Cache'
          );
          hasLoggedWarning = true;
          this.isOffline = true;
        }
      } else {
        this.logger.error('Redis Cache Error', err.stack, 'Cache');
      }
    });

    // Connect asynchronously
    this.redisClient.connect().catch((err) => {
      if (isDev) {
        this.isOffline = true;
      }
    });
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit().catch(() => {});
      this.logger.log('Disconnected from Redis Cache Server', 'Cache');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isOffline || this.redisClient?.status !== 'ready') {
      return null;
    }
    try {
      const data = await this.redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error(`Error reading key "${key}" from cache`, error.stack, 'Cache');
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (this.isOffline || this.redisClient?.status !== 'ready') {
      return;
    }
    try {
      const stringifiedValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redisClient.set(key, stringifiedValue, 'EX', ttlSeconds);
      } else {
        await this.redisClient.set(key, stringifiedValue);
      }
    } catch (error) {
      this.logger.error(`Error setting key "${key}" in cache`, error.stack, 'Cache');
    }
  }

  async del(key: string): Promise<void> {
    if (this.isOffline || this.redisClient?.status !== 'ready') {
      return;
    }
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key "${key}" from cache`, error.stack, 'Cache');
    }
  }

  async flushAll(): Promise<void> {
    if (this.isOffline || this.redisClient?.status !== 'ready') {
      return;
    }
    try {
      await this.redisClient.flushall();
      this.logger.log('Flushed all cache keys from Redis', 'Cache');
    } catch (error) {
      this.logger.error('Error flushing Redis cache', error.stack, 'Cache');
    }
  }
}
