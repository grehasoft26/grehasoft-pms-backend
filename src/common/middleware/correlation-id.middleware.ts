import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const traceIdHeaderName = 'x-correlation-id';
    const correlationId =
      (req.headers[traceIdHeaderName] as string) || uuidv4();

    // Add to request context so we can pull it in logger
    req.headers[traceIdHeaderName] = correlationId;

    // Set response header
    res.setHeader(traceIdHeaderName, correlationId);

    next();
  }
}
