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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingService = void 0;
const common_1 = require("@nestjs/common");
const service_type_1 = require("../../common/service-type");
const driver_presence_service_1 = require("../drivers/driver-presence.service");
const driver_profile_entity_1 = require("../users/entities/driver-profile.entity");
const DEFAULT_RADIUS_M = 5000;
let MatchingService = class MatchingService {
    constructor(presence) {
        this.presence = presence;
    }
    vehicleTypeFor(serviceType) {
        return serviceType === service_type_1.ServiceType.MOTO ||
            serviceType === service_type_1.ServiceType.MERCHANT_DELIVERY
            ? driver_profile_entity_1.VehicleType.MOTO
            : driver_profile_entity_1.VehicleType.CAR;
    }
    async findCandidates(serviceType, pickup, radiusM = DEFAULT_RADIUS_M, count = 5) {
        return this.presence.findNearby(this.vehicleTypeFor(serviceType), pickup, radiusM, count);
    }
    async findNearest(serviceType, pickup, radiusM = DEFAULT_RADIUS_M) {
        const candidates = await this.findCandidates(serviceType, pickup, radiusM, 1);
        return candidates[0] ?? null;
    }
};
exports.MatchingService = MatchingService;
exports.MatchingService = MatchingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [driver_presence_service_1.DriverPresenceService])
], MatchingService);
//# sourceMappingURL=matching.service.js.map