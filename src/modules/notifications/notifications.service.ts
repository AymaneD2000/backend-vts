import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { In, Repository } from 'typeorm';
import { DevicePlatform, DeviceToken } from './entities/device-token.entity';

export interface PushPayload {
  title: string;
  body: string;
  // Free-form data delivered alongside the notification (e.g. rideId, type).
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  // True once the Firebase Admin SDK is initialised with valid credentials.
  private fcmReady = false;

  constructor(
    @InjectRepository(DeviceToken)
    private readonly tokens: Repository<DeviceToken>,
    private readonly config: ConfigService,
  ) {}

  // Initialise Firebase once at boot when configured. A missing/invalid
  // credentials file leaves fcmReady false so deliver() falls back to console.
  onModuleInit(): void {
    const provider = this.config.get<string>('push.provider');
    const credentialsFile = this.config.get<string>('push.credentialsFile');
    if (provider !== 'fcm') return;
    if (!credentialsFile) {
      this.logger.warn(
        'PUSH_PROVIDER=fcm but GOOGLE_APPLICATION_CREDENTIALS is unset; ' +
          'falling back to console delivery.',
      );
      return;
    }
    try {
      if (getApps().length === 0) {
        initializeApp({ credential: applicationDefault() });
      }
      this.fcmReady = true;
      this.logger.log('Firebase Admin initialised; FCM delivery enabled.');
    } catch (err) {
      this.logger.error(
        `Failed to initialise Firebase Admin: ${(err as Error).message}`,
      );
    }
  }

  // Register (or refresh) a device token for a user. Tokens are globally
  // unique, so if it already exists we just reattach it to this user.
  async registerToken(
    userId: string,
    token: string,
    platform: DevicePlatform,
  ): Promise<void> {
    const existing = await this.tokens.findOne({ where: { token } });
    if (existing) {
      existing.userId = userId;
      existing.platform = platform;
      await this.tokens.save(existing);
      return;
    }
    await this.tokens.save(this.tokens.create({ userId, token, platform }));
  }

  async unregisterToken(token: string): Promise<void> {
    await this.tokens.delete({ token });
  }

  // Fan out a push to every device a user has registered.
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const devices = await this.tokens.find({ where: { userId } });
    if (devices.length === 0) return;
    await Promise.all(
      devices.map((d) => this.deliver(d.token, payload)),
    );
  }

  async sendToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    if (userIds.length === 0) return;
    // Load every recipient's tokens in a single query rather than firing one
    // DB round-trip per user in parallel; only the network delivery below is
    // fanned out concurrently.
    const devices = await this.tokens.find({
      where: { userId: In(userIds) },
    });
    if (devices.length === 0) return;
    await Promise.all(devices.map((d) => this.deliver(d.token, payload)));
  }

  // Provider boundary. Sends through FCM when initialised, otherwise logs so
  // the pipeline stays fully testable before real creds are wired in.
  private async deliver(token: string, payload: PushPayload): Promise<void> {
    if (!this.fcmReady) {
      this.logger.log(
        `[PUSH:console] to ${token}: ${payload.title} — ${payload.body}` +
          (payload.data ? ` ${JSON.stringify(payload.data)}` : ''),
      );
      return;
    }
    try {
      await getMessaging().send({
        token,
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'messaging/registration-token-not-registered') {
        // Token is dead (app uninstalled, etc.); drop it so we stop retrying.
        await this.tokens.delete({ token });
        this.logger.log(`Removed stale device token ${token}.`);
        return;
      }
      this.logger.error(
        `FCM delivery to ${token} failed: ${(err as Error).message}`,
      );
    }
  }
}
