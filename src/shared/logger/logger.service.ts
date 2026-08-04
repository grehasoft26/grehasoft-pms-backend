import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class LoggerService implements NestLoggerService {
  private appLogger: winston.Logger;
  private auditLogger: winston.Logger;
  private securityLogger: winston.Logger;
  private performanceLogger: winston.Logger;

  constructor() {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, context, trace }) => {
        const ctx = context ? ` [${context}]` : '';
        const trc = trace ? `\n${trace}` : '';
        return `${timestamp} ${level}:${ctx} ${message}${trc}`;
      })
    );

    // 1. Application Logger (Info, Warn, Error logs)
    this.appLogger = winston.createLogger({
      level: 'info',
      format: logFormat,
      transports: [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.DailyRotateFile({
          filename: 'logs/app-info-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
          level: 'info',
        }),
        new winston.transports.DailyRotateFile({
          filename: 'logs/app-error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
          level: 'error',
        }),
      ],
    });

    // 2. Audit Logger
    this.auditLogger = winston.createLogger({
      level: 'info',
      format: logFormat,
      transports: [
        new winston.transports.DailyRotateFile({
          filename: 'logs/audit-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '90d',
        }),
      ],
    });

    // 3. Security Logger
    this.securityLogger = winston.createLogger({
      level: 'warn',
      format: logFormat,
      transports: [
        new winston.transports.DailyRotateFile({
          filename: 'logs/security-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '90d',
        }),
      ],
    });

    // 4. Performance Logger
    this.performanceLogger = winston.createLogger({
      level: 'info',
      format: logFormat,
      transports: [
        new winston.transports.DailyRotateFile({
          filename: 'logs/performance-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
        }),
      ],
    });
  }

  // Implementation of NestJS LoggerService
  log(message: any, context?: string) {
    this.appLogger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string) {
    this.appLogger.error(message, { trace, context });
  }

  warn(message: any, context?: string) {
    this.appLogger.warn(message, { context });
  }

  debug?(message: any, context?: string) {
    this.appLogger.debug(message, { context });
  }

  verbose?(message: any, context?: string) {
    this.appLogger.verbose(message, { context });
  }

  // Enterprise Logs
  audit(
    userId: string,
    action: string,
    target: string,
    metadata: Record<string, any> = {},
    context?: { ip?: string; userAgent?: string; correlationId?: string; before?: any; after?: any }
  ) {
    this.auditLogger.info(action, {
      userId,
      target,
      metadata,
      ip: context?.ip,
      userAgent: context?.userAgent,
      correlationId: context?.correlationId,
      before: context?.before,
      after: context?.after,
    });
  }

  security(event: string, ip: string, details: Record<string, any> = {}) {
    this.securityLogger.warn(event, {
      ip,
      details,
    });
  }

  performance(metric: string, durationMs: number, details: Record<string, any> = {}) {
    this.performanceLogger.info(metric, {
      durationMs,
      details,
    });
  }
}
