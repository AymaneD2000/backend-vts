import Redis from 'ioredis';
import { ApplicationError, ApplicationErrorCode } from '../../src/common/application-error';
import { ActionRateLimiterService } from '../../src/common/action-rate-limiter.service';
import { createIntegrationRedis } from '../support/integration-redis';

describe('integration action rate limiter', () => {
  it('allows only the configured concurrent calls for one subject', async () => {
    const redis = createIntegrationRedis();
    const limiter = new ActionRateLimiterService(redis as Redis);
    const key = 'vts:rate:probe:same-subject';
    try {
      await redis.del(key);
      const results = await Promise.allSettled([
        limiter.consume('probe', 'same-subject', { limit: 2, windowSeconds: 30 }),
        limiter.consume('probe', 'same-subject', { limit: 2, windowSeconds: 30 }),
        limiter.consume('probe', 'same-subject', { limit: 2, windowSeconds: 30 }),
      ]);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(2);
      const rejected = results.find((result) => result.status === 'rejected');
      expect(rejected?.status).toBe('rejected');
      expect((rejected as PromiseRejectedResult).reason).toBeInstanceOf(ApplicationError);
      expect(((rejected as PromiseRejectedResult).reason as ApplicationError).getResponse()).toEqual(
        expect.objectContaining({ code: ApplicationErrorCode.RATE_LIMITED }),
      );
      expect(Number(await redis.ttl(key))).toBeGreaterThan(0);
    } finally {
      await redis.del(key);
      redis.disconnect();
    }
  });
});
