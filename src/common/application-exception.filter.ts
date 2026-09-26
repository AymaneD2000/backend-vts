import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApplicationErrorCode,
} from './application-error';

@Catch()
export class ApplicationExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse();
    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = isHttp ? exception.getResponse() : undefined;

    if (isRecord(raw) && typeof raw.code === 'string') {
      response.status(status).json(raw);
      return;
    }

    const body = this.safeBody(status, raw);
    response.status(status).json(body);
  }

  private safeBody(status: number, raw: unknown): Record<string, unknown> {
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      return {
        statusCode: status,
        code: ApplicationErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
      };
    }

    const source = isRecord(raw) ? raw : { message: raw };
    const message = source.message ?? 'Request failed';
    let code: ApplicationErrorCode;
    if (status === HttpStatus.UNAUTHORIZED) code = ApplicationErrorCode.AUTH_REQUIRED;
    else if (status === HttpStatus.FORBIDDEN) code = ApplicationErrorCode.FORBIDDEN;
    else if (status === HttpStatus.NOT_FOUND) code = ApplicationErrorCode.RESOURCE_NOT_FOUND;
    else if (status === HttpStatus.BAD_REQUEST) code = ApplicationErrorCode.VALIDATION_FAILED;
    else if (status === HttpStatus.CONFLICT) code = ApplicationErrorCode.INVALID_STATE_TRANSITION;
    else code = ApplicationErrorCode.INTERNAL_ERROR;

    const body: Record<string, unknown> = {
      statusCode: status,
      code,
      message,
    };
    if (Array.isArray(source.errors)) body.errors = source.errors;
    return body;
  }
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}
