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
var RidesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RidesService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const geo_1 = require("../../common/geo");
const service_type_1 = require("../../common/service-type");
const trust_level_1 = require("../../common/trust-level");
const drivers_service_1 = require("../drivers/drivers.service");
const matching_service_1 = require("../matching/matching.service");
const pricing_service_1 = require("../pricing/pricing.service");
const routing_service_1 = require("../routing/routing.service");
const trust_service_1 = require("../trust/trust.service");
const ride_entity_1 = require("./entities/ride.entity");
const ride_events_1 = require("./ride-events");
const ACTIVE_STATUSES = [
    ride_entity_1.RideStatus.REQUESTED,
    ride_entity_1.RideStatus.ACCEPTED,
    ride_entity_1.RideStatus.IN_PROGRESS,
];
const DISPATCH_RADIUS_M = 5000;
let RidesService = RidesService_1 = class RidesService {
    constructor(rides, pricing, matching, drivers, routing, trust, events) {
        this.rides = rides;
        this.pricing = pricing;
        this.matching = matching;
        this.drivers = drivers;
        this.routing = routing;
        this.trust = trust;
        this.events = events;
        this.logger = new common_1.Logger(RidesService_1.name);
    }
    onModuleInit() {
        this.scheduledDispatchTimer = setInterval(() => {
            this.runScheduledDispatch();
        }, 30_000);
        this.scheduledDispatchTimer.unref();
        this.runScheduledDispatch();
    }
    onModuleDestroy() {
        if (this.scheduledDispatchTimer)
            clearInterval(this.scheduledDispatchTimer);
    }
    runScheduledDispatch() {
        void this.dispatchDueScheduled().catch((error) => {
            const trace = error instanceof Error ? error.stack : String(error);
            this.logger.error('Scheduled delivery dispatch failed', trace);
        });
    }
    emit(ride) {
        this.events.emit(ride_events_1.RIDE_UPDATED, { ride });
    }
    offerToDrivers(ride, driverIds) {
        if (driverIds.length === 0)
            return;
        this.events.emit(ride_events_1.RIDE_OFFERED, { ride, driverIds });
    }
    withdrawOffer(rideId, driverIds) {
        if (driverIds.length === 0)
            return;
        this.events.emit(ride_events_1.RIDE_TAKEN, { rideId, driverIds });
    }
    async request(clientId, dto, extra) {
        const pickup = { lat: dto.pickup.lat, lng: dto.pickup.lng };
        const dropoff = { lat: dto.dropoff.lat, lng: dto.dropoff.lng };
        const { distanceM, durationS } = await this.routing.route(pickup, dropoff);
        const quote = this.pricing.quote(dto.serviceType, distanceM, durationS);
        const isParcel = dto.serviceType === service_type_1.ServiceType.PARCEL;
        const requiredTrustLevel = isParcel
            ? await this.trust.getRequiredTrustLevel(dto.declaredValue)
            : undefined;
        const now = new Date();
        const scheduledAt = extra?.scheduledAt;
        if (scheduledAt && scheduledAt.getTime() <= now.getTime()) {
            throw new common_1.BadRequestException('Scheduled time must be in the future');
        }
        const ride = this.rides.create({
            serviceType: dto.serviceType,
            status: ride_entity_1.RideStatus.REQUESTED,
            clientId,
            driverId: undefined,
            pickupLat: pickup.lat,
            pickupLng: pickup.lng,
            pickupAddress: dto.pickup.address,
            dropoffLat: dropoff.lat,
            dropoffLng: dropoff.lng,
            dropoffAddress: dto.dropoff.address,
            distanceM: quote.distanceM,
            durationS: quote.durationS,
            fareAmount: quote.amount,
            currency: quote.currency,
            paymentMethod: dto.paymentMethod ?? ride_entity_1.PaymentMethod.CASH,
            paymentStatus: ride_entity_1.PaymentStatus.PENDING,
            declaredValue: isParcel ? dto.declaredValue : undefined,
            parcelDescription: isParcel
                ? dto.parcelDescription
                : extra?.parcelDescription,
            recipientName: isParcel ? dto.recipientName : extra?.recipientName,
            recipientPhone: isParcel ? dto.recipientPhone : extra?.recipientPhone,
            parcelSize: isParcel ? dto.parcelSize : undefined,
            requiredTrustLevel,
            merchantId: extra?.merchantId,
            scheduledAt,
            dispatchedAt: scheduledAt ? undefined : now,
        });
        const saved = await this.rides.save(ride);
        this.emit(saved);
        if (!scheduledAt)
            await this.offerRide(saved);
        return saved;
    }
    async offerRide(ride) {
        const candidates = await this.matching.findCandidates(ride.serviceType, {
            lat: ride.pickupLat,
            lng: ride.pickupLng,
        });
        const offered = await this.eligibleDriverIds(candidates.map((c) => c.userId), ride.requiredTrustLevel ?? undefined);
        this.offerToDrivers(ride, offered);
    }
    async dispatchDueScheduled() {
        const due = await this.rides.find({
            where: {
                status: ride_entity_1.RideStatus.REQUESTED,
                scheduledAt: (0, typeorm_2.LessThanOrEqual)(new Date()),
                dispatchedAt: (0, typeorm_2.IsNull)(),
            },
            order: { scheduledAt: 'ASC' },
            take: 50,
        });
        for (const ride of due) {
            await this.claimAndDispatchScheduled(ride);
        }
    }
    async dispatchScheduled(rideId) {
        const ride = await this.getOrThrow(rideId);
        if (!ride.merchantId || !ride.scheduledAt) {
            throw new common_1.BadRequestException('Delivery is not scheduled');
        }
        if (ride.status !== ride_entity_1.RideStatus.REQUESTED || ride.driverId) {
            throw new common_1.BadRequestException(`Cannot dispatch a ${ride.status} delivery`);
        }
        if (ride.dispatchedAt) {
            throw new common_1.ConflictException('Delivery has already been dispatched');
        }
        return this.claimAndDispatchScheduled(ride);
    }
    async claimAndDispatchScheduled(ride) {
        const dispatchedAt = new Date();
        const result = await this.rides.update({
            id: ride.id,
            status: ride_entity_1.RideStatus.REQUESTED,
            dispatchedAt: (0, typeorm_2.IsNull)(),
        }, { dispatchedAt });
        if (result.affected === 0)
            return this.getOrThrow(ride.id);
        const dispatched = await this.getOrThrow(ride.id);
        this.emit(dispatched);
        await this.offerRide(dispatched);
        return dispatched;
    }
    eligibleDriverIds(driverIds, requiredTrustLevel) {
        if (requiredTrustLevel === undefined) {
            return Promise.resolve(driverIds);
        }
        return this.trust.filterByTrustLevel(driverIds, requiredTrustLevel);
    }
    async accept(rideId, driverId) {
        const pending = await this.rides.findOne({ where: { id: rideId } });
        if (!pending)
            throw new common_1.NotFoundException('Ride not found');
        if (pending.scheduledAt && !pending.dispatchedAt) {
            throw new common_1.ConflictException('Ride is not available yet');
        }
        if (pending.requiredTrustLevel !== null &&
            pending.requiredTrustLevel !== undefined &&
            pending.requiredTrustLevel > trust_level_1.TrustLevel.NONE) {
            const allowed = await this.trust.filterByTrustLevel([driverId], pending.requiredTrustLevel);
            if (allowed.length === 0) {
                throw new common_1.ForbiddenException('Trust level too low to carry this parcel');
            }
        }
        const result = await this.rides.update({ id: rideId, status: ride_entity_1.RideStatus.REQUESTED, driverId: (0, typeorm_2.IsNull)() }, {
            status: ride_entity_1.RideStatus.ACCEPTED,
            driverId,
            acceptedAt: new Date(),
        });
        if (result.affected === 0) {
            const existing = await this.rides.findOne({ where: { id: rideId } });
            if (!existing)
                throw new common_1.NotFoundException('Ride not found');
            throw new common_1.ConflictException('Ride is no longer available');
        }
        const ride = await this.getOrThrow(rideId);
        await this.drivers.goOffline(driverId);
        this.emit(ride);
        const others = await this.matching.findCandidates(ride.serviceType, {
            lat: ride.pickupLat,
            lng: ride.pickupLng,
        });
        this.withdrawOffer(ride.id, others.map((c) => c.userId).filter((id) => id !== driverId));
        return ride;
    }
    async handleDriverOnline(event) {
        const pending = await this.rides.find({
            where: { status: ride_entity_1.RideStatus.REQUESTED, driverId: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'ASC' },
            take: 20,
        });
        const pos = { lat: event.lat, lng: event.lng };
        for (const ride of pending) {
            if (ride.scheduledAt && !ride.dispatchedAt)
                continue;
            if (this.matching.vehicleTypeFor(ride.serviceType) !== event.vehicleType) {
                continue;
            }
            const d = (0, geo_1.haversineMeters)(pos, {
                lat: ride.pickupLat,
                lng: ride.pickupLng,
            });
            if (d > DISPATCH_RADIUS_M)
                continue;
            const offered = await this.eligibleDriverIds([event.driverId], ride.requiredTrustLevel ?? undefined);
            if (offered.length === 0)
                continue;
            this.offerToDrivers(ride, offered);
        }
    }
    async start(rideId, driverId) {
        const ride = await this.getOrThrow(rideId);
        this.assertDriver(ride, driverId);
        if (ride.status !== ride_entity_1.RideStatus.ACCEPTED) {
            throw new common_1.BadRequestException(`Cannot start a ${ride.status} ride`);
        }
        ride.status = ride_entity_1.RideStatus.IN_PROGRESS;
        ride.startedAt = new Date();
        const saved = await this.rides.save(ride);
        this.emit(saved);
        return saved;
    }
    async complete(rideId, driverId) {
        const ride = await this.getOrThrow(rideId);
        this.assertDriver(ride, driverId);
        if (ride.status !== ride_entity_1.RideStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException(`Cannot complete a ${ride.status} ride`);
        }
        ride.status = ride_entity_1.RideStatus.COMPLETED;
        ride.completedAt = new Date();
        if (ride.paymentMethod === ride_entity_1.PaymentMethod.CASH) {
            ride.paymentStatus = ride_entity_1.PaymentStatus.PAID;
        }
        const saved = await this.rides.save(ride);
        this.emit(saved);
        return saved;
    }
    async cancel(rideId, userId, dto = {}) {
        const ride = await this.getOrThrow(rideId);
        if (ride.clientId !== userId && ride.driverId !== userId) {
            throw new common_1.ForbiddenException('Not your ride');
        }
        if (!ACTIVE_STATUSES.includes(ride.status)) {
            throw new common_1.BadRequestException(`Cannot cancel a ${ride.status} ride`);
        }
        const wasPending = ride.status === ride_entity_1.RideStatus.REQUESTED &&
            !ride.driverId &&
            (!ride.scheduledAt || !!ride.dispatchedAt);
        ride.status = ride_entity_1.RideStatus.CANCELLED;
        ride.cancelledAt = new Date();
        ride.cancelledBy =
            ride.clientId === userId ? ride_entity_1.CancelledBy.CLIENT : ride_entity_1.CancelledBy.DRIVER;
        ride.cancelReason = dto.reason;
        ride.cancelNote = dto.note;
        const saved = await this.rides.save(ride);
        this.emit(saved);
        if (wasPending) {
            const others = await this.matching.findCandidates(saved.serviceType, {
                lat: saved.pickupLat,
                lng: saved.pickupLng,
            });
            this.withdrawOffer(saved.id, others.map((c) => c.userId));
        }
        return saved;
    }
    async get(rideId, userId) {
        const ride = await this.getOrThrow(rideId);
        if (ride.clientId !== userId && ride.driverId !== userId) {
            throw new common_1.ForbiddenException('Not your ride');
        }
        return ride;
    }
    list(userId) {
        return this.rides.find({
            where: [{ clientId: userId }, { driverId: userId }],
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }
    findByMerchantIds(merchantIds) {
        if (merchantIds.length === 0)
            return Promise.resolve([]);
        return this.rides.find({
            where: { merchantId: (0, typeorm_2.In)(merchantIds) },
            order: { createdAt: 'DESC' },
            take: 100,
        });
    }
    async findMerchantDelivery(rideId) {
        const ride = await this.rides.findOne({
            where: { id: rideId, serviceType: service_type_1.ServiceType.MERCHANT_DELIVERY },
        });
        if (!ride?.merchantId)
            throw new common_1.NotFoundException('Delivery not found');
        return ride;
    }
    getActiveRideForDriver(driverId) {
        return this.rides.findOne({
            where: { driverId, status: (0, typeorm_2.In)(ACTIVE_STATUSES) },
            order: { createdAt: 'DESC' },
        });
    }
    assertDriver(ride, driverId) {
        if (ride.driverId !== driverId) {
            throw new common_1.ForbiddenException('Not the assigned driver');
        }
    }
    async getOrThrow(rideId) {
        const ride = await this.rides.findOne({ where: { id: rideId } });
        if (!ride)
            throw new common_1.NotFoundException('Ride not found');
        return ride;
    }
};
exports.RidesService = RidesService;
__decorate([
    (0, event_emitter_1.OnEvent)(ride_events_1.DRIVER_ONLINE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RidesService.prototype, "handleDriverOnline", null);
exports.RidesService = RidesService = RidesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ride_entity_1.Ride)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        pricing_service_1.PricingService,
        matching_service_1.MatchingService,
        drivers_service_1.DriversService,
        routing_service_1.RoutingService,
        trust_service_1.TrustService,
        event_emitter_1.EventEmitter2])
], RidesService);
//# sourceMappingURL=rides.service.js.map