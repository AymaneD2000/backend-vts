import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomInt } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../redis/redis.module';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';

export type OtpChannel = 'phone' | 'email';

// OTP codes are stored hashed in Redis with a TTL, keyed by identity.
@Injectable()
export class OtpService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
    private readonly sms: SmsService,
    private readonly email: EmailService,
  ) {}

  private key(identifier: string, channel: OtpChannel): string {
    // Keep the legacy phone key so codes requested before this deployment are
    // still verifiable after the upgrade.
    return channel === 'phone'
      ? `otp:${identifier}`
      : `otp:email:${identifier}`;
  }

  private cooldownKey(identifier: string, channel: OtpChannel): string {
    return `otp:cooldown:${channel}:${identifier}`;
  }

  private attemptsKey(identifier: string, channel: OtpChannel): string {
    return `otp:attempts:${channel}:${identifier}`;
  }

  private generateCode(): string {
    const length = this.config.get<number>('otp.length') ?? 6;
    const max = 10 ** length;
    return randomInt(0, max).toString().padStart(length, '0');
  }

  async requestOtp(identifier: string, channel: OtpChannel): Promise<void> {
    const code = this.generateCode();
    const ttl = this.config.get<number>('otp.ttlSeconds') ?? 300;
    const cooldown = this.config.get<number>('otp.cooldownSeconds') ?? 60;
    const allowed = await this.redis.set(
      this.cooldownKey(identifier, channel),
      '1',
      'EX',
      cooldown,
      'NX',
    );
    if (!allowed) {
      throw new HttpException(
        'Please wait before requesting another code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const hash = await argon2.hash(code);
    const otpKey = this.key(identifier, channel);
    await this.redis.set(otpKey, hash, 'EX', ttl);
    await this.redis.del(this.attemptsKey(identifier, channel));
    try {
      if (channel === 'email') {
        await this.email.sendOtp(identifier, code);
      } else {
        await this.sms.send(identifier, `Votre code VTS est: ${code}`);
      }
    } catch (error) {
      await this.redis.del(
        otpKey,
        this.cooldownKey(identifier, channel),
      );
      throw error;
    }
  }

  async verifyOtp(
    identifier: string,
    channel: OtpChannel,
    code: string,
  ): Promise<boolean> {
    const otpKey = this.key(identifier, channel);
    const attemptsKey = this.attemptsKey(identifier, channel);
    const hash = await this.redis.get(otpKey);
    if (!hash) return false;
    const valid = await argon2.verify(hash, code);
    if (valid) {
      await this.redis.del(otpKey, attemptsKey);
      return true;
    }

    const attempts = await this.redis.incr(attemptsKey);
    if (attempts === 1) {
      const ttl = this.config.get<number>('otp.ttlSeconds') ?? 300;
      await this.redis.expire(attemptsKey, ttl);
    }
    const maxAttempts = this.config.get<number>('otp.maxAttempts') ?? 5;
    if (attempts >= maxAttempts) await this.redis.del(otpKey, attemptsKey);
    return false;
  }
}
