import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { checkSlidingWindowRateLimit } from '../utils/rate-limit.helper';

@Injectable()
export class RateLimiterService {
  async enforceLimit(identifier: string, limitCount = 60, windowSeconds = 60) {
    const check = checkSlidingWindowRateLimit(
      identifier,
      limitCount,
      windowSeconds,
    );
    if (!check.isAllowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `API rate limit exceeded. Try again in ${check.resetTimeSeconds} seconds.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return check;
  }
}
