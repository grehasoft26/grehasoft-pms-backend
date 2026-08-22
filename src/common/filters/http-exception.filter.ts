import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { LoggerService } from '../../shared/logger/logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<any>();
    const traceId = (request.headers['x-correlation-id'] as string) || '';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resBody: any = exception.getResponse();
      message =
        typeof resBody === 'string'
          ? resBody
          : resBody.message || exception.message;
      errors =
        typeof resBody === 'object' && resBody.message !== message
          ? resBody.message
          : null;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle known Prisma errors
      switch (exception.code) {
        case 'P2002': // Unique constraint violation
          status = HttpStatus.CONFLICT;
          message = `Resource already exists. Unique constraint failed on field: ${((exception.meta?.target as string[]) || []).join(', ')}`;
          break;
        case 'P2025': // Record not found
          status = HttpStatus.NOT_FOUND;
          message = 'Target record not found';
          break;
        case 'P2003': // Foreign key constraint violation
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint failed on database insert/update';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = `Database query error: ${exception.message}`;
          break;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log the error in Winston app-error.log
    const logMsg = `${request.method} ${request.url} - Status ${status} - Error: ${message}`;
    this.logger.error(logMsg, exception.stack, 'ExceptionFilter');

    // Also log to security if it's a 401 or 403
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      this.logger.security(`Unauthorized Access Attempt`, request.ip, {
        url: request.url,
        method: request.method,
        traceId,
        message,
      });
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(errors && { errors }),
      traceId,
      timestamp: new Date().toISOString(),
    });
  }
}
