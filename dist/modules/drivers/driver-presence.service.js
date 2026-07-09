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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverPresenceService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const redis_module_1 = require("../../redis/redis.module");
let DriverPresenceService = class DriverPresenceService {
    constructor(redis) {
        this.redis = redis;
    }
    geoKey(vehicleType) {
        return `drivers:available:${vehicleType}`;
    }
    setRefKey(userId) {
        return `driver:set:${userId}`;
    }
    async goOnline(userId, vehicleType, pos) {
        const key = this.geoKey(vehicleType);
        await this.redis.geoadd(key, pos.lng, pos.lat, userId);
        await this.redis.set(this.setRefKey(userId), key);
    }
    async updateLocation(userId, pos) {
        const key = await this.redis.get(this.setRefKey(userId));
        if (!key)
            return false;
        await this.redis.geoadd(key, pos.lng, pos.lat, userId);
        return true;
    }
    async goOffline(userId) {
        const key = await this.redis.get(this.setRefKey(userId));
        if (key) {
            await this.redis.zrem(key, userId);
        }
        await this.redis.del(this.setRefKey(userId));
    }
    async findNearby(vehicleType, pos, radiusM, count = 5) {
        const key = this.geoKey(vehicleType);
        const rows = (await this.redis.geosearch(key, 'FROMLONLAT', pos.lng, pos.lat, 'BYRADIUS', radiusM, 'm', 'ASC', 'COUNT', count, 'WITHCOORD', 'WITHDIST'));
        return rows.map((row) => ({
            userId: row[0],
            distanceM: parseFloat(row[1]),
            lng: parseFloat(row[2][0]),
            lat: parseFloat(row[2][1]),
        }));
    }
    async getPosition(userId) {
        const key = await this.redis.get(this.setRefKey(userId));
        if (!key)
            return null;
        const res = await this.redis.geopos(key, userId);
        const p = res?.[0];
        if (!p)
            return null;
        return { lng: parseFloat(p[0]), lat: parseFloat(p[1]) };
    }
};
exports.DriverPresenceService = DriverPresenceService;
exports.DriverPresenceService = DriverPresenceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(redis_module_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [ioredis_1.default])
], DriverPresenceService);
//# sourceMappingURL=driver-presence.service.js.map