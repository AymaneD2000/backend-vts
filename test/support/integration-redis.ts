import Redis from 'ioredis';

export function createIntegrationRedis(): Redis {
  return new Redis(process.env.TEST_REDIS_URL ?? 'redis://127.0.0.1:6380', {
    lazyConnect: false,
    maxRetriesPerRequest: 3,
  });
}
