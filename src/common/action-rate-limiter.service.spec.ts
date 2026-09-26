import { HttpStatus } from '@nestjs/common';
import { ApplicationError, ApplicationErrorCode } from './application-error';
import { ActionRateLimiterService } from './action-rate-limiter.service';

describe('ActionRateLimiterService', () => {
  function makeRedis(count: number, ttl = 30) {
    return { eval: jest.fn().mockResolvedValue([count, ttl]) };
  }

  it('allows actions up to the configured limit', async () => {
    const redis = makeRedis(2);
    const service = new ActionRateLimiterService(redis as never);

    await expect(
      service.consume('review', 'u1:m1', { limit: 2, windowSeconds: 30 }),
    ).resolves.toBeUndefined();
    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining('INCR'),
      1,
      'vts:rate:review:u1:m1',
      30,
    );
  });

  it('returns a stable rate-limited error with retry details', async () => {
    const service = new ActionRateLimiterService(makeRedis(3, 17) as never);

    await expect(
      service.consume('payment', 'u1:ride:r1', { limit: 2, windowSeconds: 30 }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: ApplicationErrorCode.RATE_LIMITED,
        retryAfterSeconds: 17,
      }),
      status: HttpStatus.TOO_MANY_REQUESTS,
    } as never);
  });

  it('rejects invalid policies before touching Redis', async () => {
    const redis = makeRedis(1);
    const service = new ActionRateLimiterService(redis as never);

    await expect(
      service.consume('', 'u1', { limit: 1, windowSeconds: 30 }),
    ).rejects.toThrow('Invalid action rate-limit policy');
    await expect(
      service.consume('scope', 'u1', { limit: 0, windowSeconds: 30 }),
    ).rejects.toThrow('Invalid action rate-limit policy');
    expect(redis.eval).not.toHaveBeenCalled();
  });
});
