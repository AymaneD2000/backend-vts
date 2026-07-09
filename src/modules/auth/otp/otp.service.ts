import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomInt } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../redis/redis.module';
import { SmsService } from '../sms/sms.service';

// OTP codes are stored hashed in Redis with a TTL, keyed by phone number.
@Injectable()
export class OtpService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
    private readonly sms: SmsService,
  ) {}

  private key(phone: string): string {
    return `otp:${phone}`;
  }

  private generateCode(): string {
    const length = this.config.get<number>('otp.length') ?? 6;
    const max = 10 ** length;
    return randomInt(0, max).toString().padStart(length, '0');
  }

  async requestOtp(phone: string): Promise<void> {
    const code = this.generateCode();
    const ttl = this.config.get<number>('otp.ttlSeconds') ?? 300;
    const hash = await argon2.hash(code);
    await this.redis.set(this.key(phone), hash, 'EX', ttl);
    await this.sms.send(phone, `Votre code VTS est: ${code}`);
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const hash = await this.redis.get(this.key(phone));
    if (!hash) return false;
    const valid = await argon2.verify(hash, code);
    if (valid) {
      await this.redis.del(this.key(phone));
    }
    return valid;
  }
}
