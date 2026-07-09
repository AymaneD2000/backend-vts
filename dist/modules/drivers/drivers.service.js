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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriversService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rating_entity_1 = require("../ratings/entities/rating.entity");
const ride_events_1 = require("../rides/ride-events");
const ride_entity_1 = require("../rides/entities/ride.entity");
const driver_profile_entity_1 = require("../users/entities/driver-profile.entity");
const user_entity_1 = require("../users/entities/user.entity");
const users_service_1 = require("../users/users.service");
const driver_presence_service_1 = require("./driver-presence.service");
let DriversService = class DriversService {
    constructor(profiles, rides, ratings, presence, users, events) {
        this.profiles = profiles;
        this.rides = rides;
        this.ratings = ratings;
        this.presence = presence;
        this.users = users;
        this.events = events;
    }
    async summary(userId) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayStats = await this.rides
            .createQueryBuilder('ride')
            .select('COUNT(ride.id)', 'count')
            .addSelect('COALESCE(SUM(ride.fare_amount), 0)', 'earnings')
            .where('ride.driver_id = :userId', { userId })
            .andWhere('ride.status = :status', { status: ride_entity_1.RideStatus.COMPLETED })
            .andWhere('ride.completed_at >= :startOfDay', { startOfDay })
            .getRawOne();
        const ratingStats = await this.ratings
            .createQueryBuilder('rating')
            .select('AVG(rating.score)', 'average')
            .addSelect('COUNT(rating.id)', 'count')
            .where('rating.ratee_id = :userId', { userId })
            .getRawOne();
        const ratingCount = Number(ratingStats?.count ?? 0);
        const average = ratingStats?.average
            ? Number(ratingStats.average)
            : null;
        return {
            todayRides: Number(todayStats?.count ?? 0),
            todayEarnings: Number(todayStats?.earnings ?? 0),
            currency: 'XOF',
            rating: average === null ? null : Math.round(average * 10) / 10,
            ratingCount,
        };
    }
    async getOrCreateProfile(userId) {
        let profile = await this.profiles.findOne({ where: { userId } });
        if (!profile) {
            profile = this.profiles.create({ userId });
            profile = await this.profiles.save(profile);
        }
        return profile;
    }
    async status(userId) {
        const profile = await this.profiles.findOne({ where: { userId } });
        const ready = Boolean(profile?.kycStatus === driver_profile_entity_1.KycStatus.APPROVED &&
            this.hasCompleteVehicleProfile(profile));
        const isAvailable = ready && Boolean(profile?.isAvailable);
        return {
            ready,
            isAvailable,
            canReceiveRides: ready && isAvailable,
            kycStatus: profile?.kycStatus ?? driver_profile_entity_1.KycStatus.PENDING,
            vehicleType: profile?.vehicleType ?? null,
            vehiclePlate: profile?.vehiclePlate ?? null,
            vehicleMake: profile?.vehicleMake ?? null,
            vehicleModel: profile?.vehicleModel ?? null,
            vehicleColor: profile?.vehicleColor ?? null,
            vehicleYear: profile?.vehicleYear ?? null,
        };
    }
    async goOnline(userId, pos) {
        const profile = await this.getOrCreateProfile(userId);
        if (profile.kycStatus !== driver_profile_entity_1.KycStatus.APPROVED) {
            throw new common_1.BadRequestException('KYC verification required before going online');
        }
        const vehicleType = profile.vehicleType;
        if (!vehicleType || !this.hasCompleteVehicleProfile(profile)) {
            throw new common_1.BadRequestException('Complete driver onboarding before going online');
        }
        profile.isAvailable = true;
        profile.lastLat = pos.lat;
        profile.lastLng = pos.lng;
        await this.profiles.save(profile);
        const user = await this.users.findById(userId);
        if (user)
            await this.users.addRole(user, user_entity_1.UserRole.DRIVER);
        await this.presence.goOnline(userId, vehicleType, pos);
        this.events.emit(ride_events_1.DRIVER_ONLINE, {
            driverId: userId,
            vehicleType,
            lat: pos.lat,
            lng: pos.lng,
        });
        return profile;
    }
    async goOffline(userId) {
        await this.presence.goOffline(userId);
        await this.profiles.update({ userId }, { isAvailable: false });
    }
    async updateLocation(userId, pos) {
        const ok = await this.presence.updateLocation(userId, pos);
        if (!ok) {
            throw new common_1.BadRequestException('Driver is offline; go online first');
        }
        await this.profiles.update({ userId }, { lastLat: pos.lat, lastLng: pos.lng });
    }
    hasCompleteVehicleProfile(profile) {
        return Boolean(profile.vehicleType &&
            profile.vehiclePlate?.trim() &&
            profile.vehicleMake?.trim() &&
            profile.vehicleModel?.trim() &&
            profile.vehicleColor?.trim());
    }
};
exports.DriversService = DriversService;
exports.DriversService = DriversService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(driver_profile_entity_1.DriverProfile)),
    __param(1, (0, typeorm_1.InjectRepository)(ride_entity_1.Ride)),
    __param(2, (0, typeorm_1.InjectRepository)(rating_entity_1.Rating)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        driver_presence_service_1.DriverPresenceService,
        users_service_1.UsersService,
        event_emitter_1.EventEmitter2])
], DriversService);
//# sourceMappingURL=drivers.service.js.map