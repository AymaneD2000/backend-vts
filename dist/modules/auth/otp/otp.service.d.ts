import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { SmsService } from '../sms/sms.service';
export declare class OtpService {
    private readonly redis;
    private readonly config;
    private readonly sms;
    constructor(redis: Redis, config: ConfigService, sms: SmsService);
    private key;
    private generateCode;
    requestOtp(phone: string): Promise<void>;
    verifyOtp(phone: string, code: string): Promise<boolean>;
}
