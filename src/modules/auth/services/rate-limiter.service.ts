import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CacheService } from '../../../shared/cache/cache.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimiterService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Evaluates if a request should be blocked by rate limiting.
   * If limited, throws a Too Many Requests exception.
   */
  async checkLimit(
    key: string,
    maxAttempts: number,
    windowMs: number,
  ): Promise<void> {
    const redisKey = `ratelimit:${key}`;
    const windowSeconds = Math.ceil(windowMs / 1000);

    try {
      const current = await this.cacheService.get<number>(redisKey);

      if (current !== null) {
        if (current >= maxAttempts) {
          throw new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              message: 'Too many requests, please try again later.',
              error: 'Too Many Requests',
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        await this.cacheService.set(redisKey, current + 1, windowSeconds);
      } else {
        // First request in window
        await this.cacheService.set(redisKey, 1, windowSeconds);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // Fail-open: if Redis cache fails or is offline, bypass rate limiting
    }
  }

  async checkLoginLimit(ip: string, email: string): Promise<void> {
    const max =
      this.configService.get<number>('app.auth.rateLimitLoginMax') || 5;
    const windowMs =
      this.configService.get<number>('app.auth.rateLimitLoginWindowMs') ||
      60000;

    // Limit by combined IP and Email
    const key = `login:${ip}:${email}`;
    await this.checkLimit(key, max, windowMs);
  }

  async checkForgotLimit(ip: string): Promise<void> {
    const max =
      this.configService.get<number>('app.auth.rateLimitForgotMax') || 3;
    const windowMs =
      this.configService.get<number>('app.auth.rateLimitForgotWindowMs') ||
      900000;

    const key = `forgot:${ip}`;
    await this.checkLimit(key, max, windowMs);
  }

  async checkResetLimit(ip: string): Promise<void> {
    const max =
      this.configService.get<number>('app.auth.rateLimitResetMax') || 3;
    const windowMs =
      this.configService.get<number>('app.auth.rateLimitResetWindowMs') ||
      900000;

    const key = `reset:${ip}`;
    await this.checkLimit(key, max, windowMs);
  }
}
