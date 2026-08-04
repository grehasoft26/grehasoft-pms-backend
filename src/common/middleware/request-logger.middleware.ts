import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../../shared/logger/logger.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const traceId = (req.headers['x-correlation-id'] as string) || '';

    // Listen to response finish event to log stats
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      this.logger.performance(`HTTP ${method} ${originalUrl}`, duration, {
        statusCode,
        traceId,
        ip,
        userAgent,
      });

      // Log to application log as well
      const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;
      if (statusCode >= 500) {
        this.logger.error(message, undefined, 'HTTP');
      } else if (statusCode >= 400) {
        this.logger.warn(message, 'HTTP');
      } else {
        this.logger.log(message, 'HTTP');
      }
    });

    next();
  }
}
