"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
const typeorm_2 = require("typeorm");
const device_token_entity_1 = require("./entities/device-token.entity");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(tokens, config) {
        this.tokens = tokens;
        this.config = config;
        this.logger = new common_1.Logger(NotificationsService_1.name);
        this.fcmReady = false;
    }
    onModuleInit() {
        const provider = this.config.get('push.provider');
        const credentialsFile = this.config.get('push.credentialsFile');
        if (provider !== 'fcm')
            return;
        if (!credentialsFile) {
            this.logger.warn('PUSH_PROVIDER=fcm but GOOGLE_APPLICATION_CREDENTIALS is unset; ' +
                'falling back to console delivery.');
            return;
        }
        try {
            if ((0, app_1.getApps)().length === 0) {
                (0, app_1.initializeApp)({ credential: (0, app_1.applicationDefault)() });
            }
            this.fcmReady = true;
            this.logger.log('Firebase Admin initialised; FCM delivery enabled.');
        }
        catch (err) {
            this.logger.error(`Failed to initialise Firebase Admin: ${err.message}`);
        }
    }
    async registerToken(userId, token, platform) {
        const existing = await this.tokens.findOne({ where: { token } });
        if (existing) {
            existing.userId = userId;
            existing.platform = platform;
            await this.tokens.save(existing);
            return;
        }
        await this.tokens.save(this.tokens.create({ userId, token, platform }));
    }
    async unregisterToken(token) {
        await this.tokens.delete({ token });
    }
    async sendToUser(userId, payload) {
        const devices = await this.tokens.find({ where: { userId } });
        if (devices.length === 0)
            return;
        await Promise.all(devices.map((d) => this.deliver(d.token, payload)));
    }
    async sendToUsers(userIds, payload) {
        if (userIds.length === 0)
            return;
        const devices = await this.tokens.find({
            where: { userId: (0, typeorm_2.In)(userIds) },
        });
        if (devices.length === 0)
            return;
        await Promise.all(devices.map((d) => this.deliver(d.token, payload)));
    }
    async deliver(token, payload) {
        if (!this.fcmReady) {
            this.logger.log(`[PUSH:console] to ${token}: ${payload.title} — ${payload.body}` +
                (payload.data ? ` ${JSON.stringify(payload.data)}` : ''));
            return;
        }
        try {
            await (0, messaging_1.getMessaging)().send({
                token,
                notification: { title: payload.title, body: payload.body },
                data: payload.data,
            });
        }
        catch (err) {
            const code = err.code;
            if (code === 'messaging/registration-token-not-registered') {
                await this.tokens.delete({ token });
                this.logger.log(`Removed stale device token ${token}.`);
                return;
            }
            this.logger.error(`FCM delivery to ${token} failed: ${err.message}`);
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(device_token_entity_1.DeviceToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map