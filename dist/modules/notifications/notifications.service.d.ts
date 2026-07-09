import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { DevicePlatform, DeviceToken } from './entities/device-token.entity';
export interface PushPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}
export declare class NotificationsService implements OnModuleInit {
    private readonly tokens;
    private readonly config;
    private readonly logger;
    private fcmReady;
    constructor(tokens: Repository<DeviceToken>, config: ConfigService);
    onModuleInit(): void;
    registerToken(userId: string, token: string, platform: DevicePlatform): Promise<void>;
    unregisterToken(token: string): Promise<void>;
    sendToUser(userId: string, payload: PushPayload): Promise<void>;
    sendToUsers(userIds: string[], payload: PushPayload): Promise<void>;
    private deliver;
}
