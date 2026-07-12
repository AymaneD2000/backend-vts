import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
export type OtpChannel = 'phone' | 'email';
export declare class OtpService {
    private readonly redis;
    private readonly config;
    private readonly sms;
    private readonly email;
    constructor(redis: Redis, config: ConfigService, sms: SmsService, email: EmailService);
    private key;
    private cooldownKey;
    private attemptsKey;
    private generateCode;
    requestOtp(identifier: string, channel: OtpChannel): Promise<void>;
    verifyOtp(identifier: string, channel: OtpChannel, code: string): Promise<boolean>;
}
