import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from './app.error';
import { ErrorCode } from './error-code';

interface ErrorResponseBody {
  code: ErrorCode | string;
  message: string;
  details?: unknown;
  path: string;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, body } = this.mapException(exception, request.url);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status} ${body.code}: ${body.message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} → ${status} ${body.code}: ${body.message}`,
      );
    }

    response.status(status).json(body);
  }

  private mapException(
    exception: unknown,
    path: string,
  ): { status: number; body: ErrorResponseBody } {
    const timestamp = new Date().toISOString();

    if (exception instanceof AppError) {
      return {
        status: exception.httpStatus,
        body: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
          path,
          timestamp,
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : (response as { message?: string | string[] }).message ??
            exception.message;
      return {
        status,
        body: {
          code: ErrorCode.VALIDATION,
          message: Array.isArray(message) ? message.join('; ') : message,
          details: typeof response === 'object' ? response : undefined,
          path,
          timestamp,
        },
      };
    }

    return {
      status: 500,
      body: {
        code: ErrorCode.INTERNAL,
        message: 'Internal server error',
        path,
        timestamp,
      },
    };
  }
}
