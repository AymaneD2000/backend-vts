import {
  ArgumentsHost,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApplicationError, ApplicationErrorCode } from './application-error';
import { ApplicationExceptionFilter } from './application-exception.filter';

describe('ApplicationExceptionFilter', () => {
  function response() {
    const res = { status: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    return res;
  }

  function host(res: ReturnType<typeof response>): ArgumentsHost {
    return {
      switchToHttp: () => ({ getResponse: () => res }),
    } as unknown as ArgumentsHost;
  }

  it('preserves an ApplicationError response', () => {
    const res = response();
    new ApplicationExceptionFilter().catch(
      new ApplicationError(409, ApplicationErrorCode.OUT_OF_STOCK, 'Stock'),
      host(res),
    );
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'OUT_OF_STOCK' }),
    );
  });

  it('maps auth failures and validation arrays to stable codes', () => {
    const authRes = response();
    new ApplicationExceptionFilter().catch(
      new UnauthorizedException(),
      host(authRes),
    );
    expect(authRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'AUTH_REQUIRED' }),
    );

    const validationRes = response();
    new ApplicationExceptionFilter().catch(
      new BadRequestException({
        message: ['name must not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      }),
      host(validationRes),
    );
    expect(validationRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'VALIDATION_FAILED',
        message: ['name must not be empty'],
      }),
    );
  });

  it('does not expose raw unknown errors', () => {
    const res = response();
    new ApplicationExceptionFilter().catch(new Error('secret stack'), host(res));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INTERNAL_ERROR', message: 'Internal server error' }),
    );
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('secret stack');
  });
});
