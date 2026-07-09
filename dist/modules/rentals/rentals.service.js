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
exports.RentalsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ride_entity_1 = require("../rides/entities/ride.entity");
const rental_events_1 = require("./rental-events");
const rental_booking_entity_1 = require("./entities/rental-booking.entity");
const rental_vehicle_entity_1 = require("./entities/rental-vehicle.entity");
const ACTIVE_STATUSES = [
    rental_booking_entity_1.RentalStatus.REQUESTED,
    rental_booking_entity_1.RentalStatus.ACCEPTED,
    rental_booking_entity_1.RentalStatus.IN_PROGRESS,
];
const DEFAULT_VEHICLES = [
    {
        name: 'Moto 125cc',
        category: rental_vehicle_entity_1.RentalCategory.MOTO,
        dailyPrice: 10000,
        description: 'Moto pratique pour les déplacements en ville.',
    },
    {
        name: 'Berline 4 places',
        category: rental_vehicle_entity_1.RentalCategory.CAR,
        dailyPrice: 35000,
        description: 'Voiture confortable pour événements et trajets.',
    },
    {
        name: 'Tricycle 3 roues',
        category: rental_vehicle_entity_1.RentalCategory.TRICYCLE,
        dailyPrice: 15000,
        description: 'Moto à 3 roues pour le transport de charges.',
    },
];
let RentalsService = class RentalsService {
    constructor(vehicles, bookings, events) {
        this.vehicles = vehicles;
        this.bookings = bookings;
        this.events = events;
    }
    emitUpdated(booking) {
        this.events.emit(rental_events_1.RENTAL_UPDATED, { booking });
    }
    async onModuleInit() {
        for (const v of DEFAULT_VEHICLES) {
            const existing = await this.vehicles.findOne({ where: { name: v.name } });
            if (!existing) {
                await this.vehicles.save(this.vehicles.create(v));
            }
        }
    }
    createVehicle(dto) {
        return this.vehicles.save(this.vehicles.create(dto));
    }
    listVehicles() {
        return this.vehicles.find({ order: { createdAt: 'DESC' } });
    }
    async updateVehicle(id, dto) {
        const vehicle = await this.vehicles.findOne({ where: { id } });
        if (!vehicle)
            throw new common_1.NotFoundException('Vehicle not found');
        Object.assign(vehicle, dto);
        return this.vehicles.save(vehicle);
    }
    listBookings() {
        return this.bookings.find({ order: { createdAt: 'DESC' }, take: 200 });
    }
    async listCatalog() {
        const vehicles = await this.vehicles.find({
            where: { isAvailable: true },
            order: { dailyPrice: 'ASC' },
        });
        const counts = await this.activeCounts(vehicles.map((v) => v.id));
        return vehicles.map((v) => ({
            ...v,
            availableUnits: Math.max(0, v.quantity - (counts.get(v.id) ?? 0)),
        }));
    }
    async activeCounts(vehicleIds) {
        const counts = new Map();
        if (vehicleIds.length === 0)
            return counts;
        const rows = await this.bookings
            .createQueryBuilder('b')
            .select('b.vehicleId', 'vehicleId')
            .addSelect('COUNT(*)', 'count')
            .where('b.vehicleId IN (:...vehicleIds)', { vehicleIds })
            .andWhere('b.status IN (:...statuses)', { statuses: ACTIVE_STATUSES })
            .groupBy('b.vehicleId')
            .getRawMany();
        for (const row of rows)
            counts.set(row.vehicleId, Number(row.count));
        return counts;
    }
    activeCountFor(vehicleId) {
        return this.bookings.count({
            where: { vehicleId, status: (0, typeorm_2.In)(ACTIVE_STATUSES) },
        });
    }
    async book(clientId, dto) {
        const vehicle = await this.vehicles.findOne({
            where: { id: dto.vehicleId },
        });
        if (!vehicle)
            throw new common_1.NotFoundException('Vehicle not found');
        if (!vehicle.isAvailable) {
            throw new common_1.BadRequestException('Vehicle is not available');
        }
        const activeCount = await this.activeCountFor(vehicle.id);
        if (activeCount >= vehicle.quantity) {
            throw new common_1.BadRequestException('Vehicle is fully booked');
        }
        const days = this.computeDays(dto.startDate, dto.endDate);
        const totalAmount = vehicle.dailyPrice * days;
        const booking = this.bookings.create({
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
            category: vehicle.category,
            dailyPrice: vehicle.dailyPrice,
            clientId,
            status: rental_booking_entity_1.RentalStatus.REQUESTED,
            startDate: dto.startDate,
            endDate: dto.endDate,
            days,
            pickupLat: dto.pickupLat,
            pickupLng: dto.pickupLng,
            pickupAddress: dto.pickupAddress,
            note: dto.note,
            totalAmount,
            currency: 'XOF',
            paymentMethod: dto.paymentMethod ?? ride_entity_1.PaymentMethod.CASH,
            paymentStatus: ride_entity_1.PaymentStatus.PENDING,
        });
        const saved = await this.bookings.save(booking);
        this.emitUpdated(saved);
        return saved;
    }
    myBookings(clientId) {
        return this.bookings.find({
            where: [{ clientId }, { driverId: clientId }],
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }
    async get(id, userId) {
        const booking = await this.getOrThrow(id);
        if (booking.clientId !== userId && booking.driverId !== userId) {
            throw new common_1.ForbiddenException('Not your booking');
        }
        return booking;
    }
    async cancel(id, userId, dto = {}) {
        const booking = await this.getOrThrow(id);
        if (booking.clientId !== userId && booking.driverId !== userId) {
            throw new common_1.ForbiddenException('Not your booking');
        }
        if (!ACTIVE_STATUSES.includes(booking.status)) {
            throw new common_1.BadRequestException(`Cannot cancel a ${booking.status} booking`);
        }
        booking.status = rental_booking_entity_1.RentalStatus.CANCELLED;
        booking.cancelledAt = new Date();
        booking.cancelledBy =
            booking.clientId === userId ? ride_entity_1.CancelledBy.CLIENT : ride_entity_1.CancelledBy.DRIVER;
        booking.cancelNote = dto.note;
        const saved = await this.bookings.save(booking);
        this.emitUpdated(saved);
        return saved;
    }
    listPending() {
        return this.bookings.find({
            where: { status: rental_booking_entity_1.RentalStatus.REQUESTED, driverId: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'ASC' },
            take: 50,
        });
    }
    async accept(id, driverId) {
        const result = await this.bookings.update({ id, status: rental_booking_entity_1.RentalStatus.REQUESTED, driverId: (0, typeorm_2.IsNull)() }, { status: rental_booking_entity_1.RentalStatus.ACCEPTED, driverId, acceptedAt: new Date() });
        if (result.affected === 0) {
            const existing = await this.bookings.findOne({ where: { id } });
            if (!existing)
                throw new common_1.NotFoundException('Booking not found');
            throw new common_1.ConflictException('Booking is no longer available');
        }
        const booking = await this.getOrThrow(id);
        this.emitUpdated(booking);
        return booking;
    }
    async start(id, driverId) {
        const booking = await this.getOrThrow(id);
        this.assertDriver(booking, driverId);
        if (booking.status !== rental_booking_entity_1.RentalStatus.ACCEPTED) {
            throw new common_1.BadRequestException(`Cannot start a ${booking.status} booking`);
        }
        booking.status = rental_booking_entity_1.RentalStatus.IN_PROGRESS;
        booking.startedAt = new Date();
        const saved = await this.bookings.save(booking);
        this.emitUpdated(saved);
        return saved;
    }
    async complete(id, driverId) {
        const booking = await this.getOrThrow(id);
        this.assertDriver(booking, driverId);
        if (booking.status !== rental_booking_entity_1.RentalStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException(`Cannot complete a ${booking.status} booking`);
        }
        booking.status = rental_booking_entity_1.RentalStatus.COMPLETED;
        booking.completedAt = new Date();
        if (booking.paymentMethod === ride_entity_1.PaymentMethod.CASH) {
            booking.paymentStatus = ride_entity_1.PaymentStatus.PAID;
        }
        const saved = await this.bookings.save(booking);
        this.emitUpdated(saved);
        return saved;
    }
    computeDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new common_1.BadRequestException('Invalid dates');
        }
        if (end < start) {
            throw new common_1.BadRequestException('End date must be after start date');
        }
        const ms = end.getTime() - start.getTime();
        return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
    }
    assertDriver(booking, driverId) {
        if (booking.driverId !== driverId) {
            throw new common_1.ForbiddenException('Not the assigned driver');
        }
    }
    async getOrThrow(id) {
        const booking = await this.bookings.findOne({ where: { id } });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        return booking;
    }
};
exports.RentalsService = RentalsService;
exports.RentalsService = RentalsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(rental_vehicle_entity_1.RentalVehicle)),
    __param(1, (0, typeorm_1.InjectRepository)(rental_booking_entity_1.RentalBooking)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], RentalsService);
//# sourceMappingURL=rentals.service.js.map