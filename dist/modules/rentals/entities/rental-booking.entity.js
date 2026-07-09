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
exports.RentalBooking = exports.RentalStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const ride_entity_1 = require("../../rides/entities/ride.entity");
const rental_vehicle_entity_1 = require("./rental-vehicle.entity");
var RentalStatus;
(function (RentalStatus) {
    RentalStatus["REQUESTED"] = "requested";
    RentalStatus["ACCEPTED"] = "accepted";
    RentalStatus["IN_PROGRESS"] = "in_progress";
    RentalStatus["COMPLETED"] = "completed";
    RentalStatus["CANCELLED"] = "cancelled";
    RentalStatus["NO_DRIVER"] = "no_driver";
})(RentalStatus || (exports.RentalStatus = RentalStatus = {}));
let RentalBooking = class RentalBooking {
};
exports.RentalBooking = RentalBooking;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RentalBooking.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => rental_vehicle_entity_1.RentalVehicle, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'vehicle_id' }),
    __metadata("design:type", rental_vehicle_entity_1.RentalVehicle)
], RentalBooking.prototype, "vehicle", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'vehicle_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], RentalBooking.prototype, "vehicleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vehicle_name' }),
    __metadata("design:type", String)
], RentalBooking.prototype, "vehicleName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: rental_vehicle_entity_1.RentalCategory }),
    __metadata("design:type", String)
], RentalBooking.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'daily_price', type: 'numeric', precision: 12, scale: 0 }),
    __metadata("design:type", Number)
], RentalBooking.prototype, "dailyPrice", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", user_entity_1.User)
], RentalBooking.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'client_id' }),
    __metadata("design:type", String)
], RentalBooking.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'driver_id' }),
    __metadata("design:type", user_entity_1.User)
], RentalBooking.prototype, "driver", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'driver_id', nullable: true }),
    __metadata("design:type", String)
], RentalBooking.prototype, "driverId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'enum', enum: RentalStatus, default: RentalStatus.REQUESTED }),
    __metadata("design:type", String)
], RentalBooking.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', type: 'date' }),
    __metadata("design:type", String)
], RentalBooking.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_date', type: 'date' }),
    __metadata("design:type", String)
], RentalBooking.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], RentalBooking.prototype, "days", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pickup_lat', type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], RentalBooking.prototype, "pickupLat", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pickup_lng', type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], RentalBooking.prototype, "pickupLng", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pickup_address', nullable: true }),
    __metadata("design:type", String)
], RentalBooking.prototype, "pickupAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], RentalBooking.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_amount', type: 'numeric', precision: 12, scale: 0 }),
    __metadata("design:type", Number)
], RentalBooking.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'XOF' }),
    __metadata("design:type", String)
], RentalBooking.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'payment_method',
        type: 'enum',
        enum: ride_entity_1.PaymentMethod,
        default: ride_entity_1.PaymentMethod.CASH,
    }),
    __metadata("design:type", String)
], RentalBooking.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'payment_status',
        type: 'enum',
        enum: ride_entity_1.PaymentStatus,
        default: ride_entity_1.PaymentStatus.PENDING,
    }),
    __metadata("design:type", String)
], RentalBooking.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'accepted_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], RentalBooking.prototype, "acceptedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], RentalBooking.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], RentalBooking.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancelled_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], RentalBooking.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'cancelled_by',
        type: 'enum',
        enum: ride_entity_1.CancelledBy,
        nullable: true,
    }),
    __metadata("design:type", String)
], RentalBooking.prototype, "cancelledBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancel_note', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RentalBooking.prototype, "cancelNote", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], RentalBooking.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], RentalBooking.prototype, "updatedAt", void 0);
exports.RentalBooking = RentalBooking = __decorate([
    (0, typeorm_1.Entity)('rental_bookings')
], RentalBooking);
//# sourceMappingURL=rental-booking.entity.js.map