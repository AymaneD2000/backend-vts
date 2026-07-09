"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const service_type_1 = require("../../common/service-type");
const RATE_CARDS = {
    [service_type_1.ServiceType.RIDE_CAR]: {
        base: 500,
        perKm: 250,
        perMin: 25,
        minimum: 1000,
        avgSpeedKmh: 25,
    },
    [service_type_1.ServiceType.MOTO]: {
        base: 250,
        perKm: 150,
        perMin: 15,
        minimum: 500,
        avgSpeedKmh: 30,
    },
    [service_type_1.ServiceType.PARCEL]: {
        base: 500,
        perKm: 200,
        perMin: 10,
        minimum: 750,
        avgSpeedKmh: 25,
    },
    [service_type_1.ServiceType.MERCHANT_DELIVERY]: {
        base: 300,
        perKm: 175,
        perMin: 12,
        minimum: 600,
        avgSpeedKmh: 30,
    },
};
let PricingService = class PricingService {
    getRateCard(serviceType) {
        return RATE_CARDS[serviceType];
    }
    estimateDurationS(serviceType, distanceM) {
        const { avgSpeedKmh } = this.getRateCard(serviceType);
        const hours = distanceM / 1000 / avgSpeedKmh;
        return Math.round(hours * 3600);
    }
    quote(serviceType, distanceM, durationS) {
        const card = this.getRateCard(serviceType);
        const duration = durationS ?? this.estimateDurationS(serviceType, distanceM);
        const distanceCost = (distanceM / 1000) * card.perKm;
        const timeCost = (duration / 60) * card.perMin;
        const raw = card.base + distanceCost + timeCost;
        const amount = Math.max(card.minimum, Math.round(raw / 50) * 50);
        return {
            serviceType,
            currency: 'XOF',
            distanceM: Math.round(distanceM),
            durationS: duration,
            base: card.base,
            distanceCost: Math.round(distanceCost),
            timeCost: Math.round(timeCost),
            amount,
        };
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)()
], PricingService);
//# sourceMappingURL=pricing.service.js.map