import { Global, Module } from '@nestjs/common';
import { ActionRateLimiterService } from './action-rate-limiter.service';

@Global()
@Module({
  providers: [ActionRateLimiterService],
  exports: [ActionRateLimiterService],
})
export class ActionRateLimitModule {}
