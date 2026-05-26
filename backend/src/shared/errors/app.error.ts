import { ErrorCode } from './error-code';

export interface AppErrorOptions {
  code: ErrorCode;
  httpStatus: number;
  message: string;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;

  constructor(opts: AppErrorOptions) {
    super(opts.message);
    this.name = this.constructor.name;
    this.code = opts.code;
    this.httpStatus = opts.httpStatus;
    this.details = opts.details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super({
      code: ErrorCode.NOT_FOUND,
      httpStatus: 404,
      message: id ? `${resource} ${id} not found` : `${resource} not found`,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({ code: ErrorCode.CONFLICT, httpStatus: 409, message, details });
  }
}

export class DomainRuleError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({ code: ErrorCode.DOMAIN_RULE, httpStatus: 422, message, details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super({ code: ErrorCode.UNAUTHORIZED, httpStatus: 401, message });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super({ code: ErrorCode.FORBIDDEN, httpStatus: 403, message });
  }
}

export class UpstreamError extends AppError {
  constructor(service: string, cause?: unknown) {
    super({
      code: ErrorCode.UPSTREAM,
      httpStatus: 502,
      message: `Upstream service "${service}" failed`,
      details: cause ? { cause: String(cause) } : undefined,
    });
  }
}
