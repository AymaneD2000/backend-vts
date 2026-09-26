import { HttpStatus, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.module';
import { ApplicationError, ApplicationErrorCode } from './application-error';
import { Inject } from '@nestjs/common';

export interface ActionRateLimitPolicy {
  limit: number;
  windowSeconds: number;
}

@Injectable()
export class ActionRateLimiterService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisLike) {}

  async consume(
    scope: string,
    subject: string,
    policy: ActionRateLimitPolicy,
  ): Promise<void> {
    if (
      !scope ||
      !subject ||
      policy.limit < 1 ||
      policy.windowSeconds < 1
    ) {
      throw new Error('Invalid action rate-limit policy');
    }

    const key = `vts:rate:${scope}:${subject}`;
    const [rawCount, rawTtl] = (await this.redis.eval(
      `
        local count = redis.call('INCR', KEYS[1])
        if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
        return { count, redis.call('TTL', KEYS[1]) }
      `,
      1,
      key,
      policy.windowSeconds,
    )) as [number | string, number | string];
    const count = Number(rawCount);
    const retryAfterSeconds = Math.max(1, Number(rawTtl));
    if (count > policy.limit) {
      throw new ApplicationError(
        HttpStatus.TOO_MANY_REQUESTS,
        ApplicationErrorCode.RATE_LIMITED,
        'Trop de tentatives. Réessayez plus tard.',
        { retryAfterSeconds },
      );
    }
  }
}

interface RedisLike {
  eval(
    script: string,
    numberOfKeys: number,
    key: string,
    arg: number,
  ): Promise<unknown>;
}
