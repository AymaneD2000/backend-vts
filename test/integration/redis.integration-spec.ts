import { createIntegrationRedis } from '../support/integration-redis';

describe('integration redis', () => {
  it('sets, reads and deletes a namespaced key', async () => {
    const redis = createIntegrationRedis();
    const key = `vts:test:${Date.now()}`;
    try {
      await redis.set(key, 'ok', 'EX', 30);
      await expect(redis.get(key)).resolves.toBe('ok');
      await redis.del(key);
      await expect(redis.get(key)).resolves.toBeNull();
    } finally {
      redis.disconnect();
    }
  });
});
