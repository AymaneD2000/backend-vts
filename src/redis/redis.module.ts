import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('Redis');
        const url = config.get<string>('redis.url');
        const options = {
          lazyConnect: false,
          maxRetriesPerRequest: 3,
        };
        const client = url
          ? new Redis(url, options)
          : new Redis({
              ...options,
              host: config.get<string>('redis.host'),
              port: config.get<number>('redis.port'),
              password: config.get<string>('redis.password') || undefined,
            });
        client.on('error', (err) => {
          logger.error(`Redis connection failed: ${err.message}`);
        });
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
