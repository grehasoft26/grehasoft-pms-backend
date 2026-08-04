import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  traceId?: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const statusCode = response.statusCode;
    const traceId = (request.headers['x-correlation-id'] as string) || '';

    return next.handle().pipe(
      map((res) => {
        // If response is already formatted (e.g. from dynamic response builders)
        if (res && typeof res === 'object' && 'success' in res && 'statusCode' in res) {
          return {
            ...res,
            traceId,
          };
        }

        let message = 'Operation completed successfully';
        let data = res;

        // If the return object contains a message property alongside data
        if (res && typeof res === 'object' && 'message' in res && 'data' in res) {
          message = res.message;
          data = res.data;
        }

        return {
          success: true,
          statusCode,
          message,
          data,
          traceId,
        };
      })
    );
  }
}
