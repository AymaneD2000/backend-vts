"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const argon2 = __importStar(require("argon2"));
const crypto_1 = require("crypto");
const ioredis_1 = __importDefault(require("ioredis"));
const redis_module_1 = require("../../../redis/redis.module");
const sms_service_1 = require("../sms/sms.service");
let OtpService = class OtpService {
    constructor(redis, config, sms) {
        this.redis = redis;
        this.config = config;
        this.sms = sms;
    }
    key(phone) {
        return `otp:${phone}`;
    }
    generateCode() {
        const length = this.config.get('otp.length') ?? 6;
        const max = 10 ** length;
        return (0, crypto_1.randomInt)(0, max).toString().padStart(length, '0');
    }
    async requestOtp(phone) {
        const code = this.generateCode();
        const ttl = this.config.get('otp.ttlSeconds') ?? 300;
        const hash = await argon2.hash(code);
        await this.redis.set(this.key(phone), hash, 'EX', ttl);
        await this.sms.send(phone, `Votre code VTS est: ${code}`);
    }
    async verifyOtp(phone, code) {
        const hash = await this.redis.get(this.key(phone));
        if (!hash)
            return false;
        const valid = await argon2.verify(hash, code);
        if (valid) {
            await this.redis.del(this.key(phone));
        }
        return valid;
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(redis_module_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [ioredis_1.default,
        config_1.ConfigService,
        sms_service_1.SmsService])
], OtpService);
//# sourceMappingURL=otp.service.js.map