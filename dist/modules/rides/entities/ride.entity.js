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
exports.Ride = exports.PaymentStatus = exports.CancelReason = exports.CancelledBy = exports.PaymentMethod = exports.RideStatus = exports.ParcelSize = void 0;
const typeorm_1 = require("typeorm");
const service_type_1 = require("../../../common/service-type");
const trust_level_1 = require("../../../common/trust-level");
const user_entity_1 = require("../../users/entities/user.entity");
var ParcelSize;
(function (ParcelSize) {
    ParcelSize["SMALL"] = "small";
    ParcelSize["MEDIUM"] = "medium";
    ParcelSize["LARGE"] = "large";
})(ParcelSize || (exports.ParcelSize = ParcelSize = {}));
var RideStatus;
(function (RideStatus) {
    RideStatus["REQUESTED"] = "requested";
    RideStatus["ACCEPTED"] = "accepted";
    RideStatus["IN_PROGRESS"] = "in_progress";
    RideStatus["COMPLETED"] = "completed";
    RideStatus["CANCELLED"] = "cancelled";
    RideStatus["NO_DRIVER"] = "no_driver";
})(RideStatus || (exports.RideStatus = RideStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["MOBILE_MONEY"] = "mobile_money";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var CancelledBy;
(function (CancelledBy) {
    CancelledBy["CLIENT"] = "client";
    CancelledBy["DRIVER"] = "driver";
})(CancelledBy || (exports.CancelledBy = CancelledBy = {}));
var CancelReason;
(function (CancelReason) {
    CancelReason["CHANGED_MIND"] = "changed_mind";
    CancelReason["DRIVER_TOO_FAR"] = "driver_too_far";
    CancelReason["WAIT_TOO_LONG"] = "wait_too_long";
    CancelReason["WRONG_ADDRESS"] = "wrong_address";
    CancelReason["CLIENT_NO_SHOW"] = "client_no_show";
    CancelReason["CLIENT_UNREACHABLE"] = "client_unreachable";
    CancelReason["PRICE"] = "price";
    CancelReason["OTHER"] = "other";
})(CancelReason || (exports.CancelReason = CancelReason = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
let Ride = class Ride {
};
exports.Ride = Ride;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Ride.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'service_type', type: 'enum', enum: service_type_1.ServiceType }),
    __metadata("design:type", String)
], Ride.prototype, "serviceType", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'enum', enum: RideStatus, default: RideStatus.REQUESTED }),
    __metadata("design:type", String)
], Ride.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", user_entity_1.User)
], Ride.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'client_id' }),
    __metadata("design:type", String)
], Ride.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'driver_id' }),
    __metadata("design:type", user_entity_1.User)
], Ride.prototype, "driver", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'driver_id', nullable: true }),
    __metadata("design:type", String)
], Ride.prototype, "driverId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pickup_lat', type: 'double precision' }),
    __metadata("design:type", Number)
], Ride.prototype, "pickupLat", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pickup_lng', type: 'double precision' }),
    __metadata("design:type", Number)
], Ride.prototype, "pickupLng", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pickup_address', nullable: true }),
    __metadata("design:type", String)
], Ride.prototype, "pickupAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dropoff_lat', type: 'double precision' }),
    __metadata("design:type", Number)
], Ride.prototype, "dropoffLat", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dropoff_lng', type: 'double precision' }),
    __metadata("design:type", Number)
], Ride.prototype, "dropoffLng", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dropoff_address', nullable: true }),
    __metadata("design:type", String)
], Ride.prototype, "dropoffAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'distance_m', type: 'int' }),
    __metadata("design:type", Number)
], Ride.prototype, "distanceM", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration_s', type: 'int' }),
    __metadata("design:type", Number)
], Ride.prototype, "durationS", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fare_amount', type: 'int' }),
    __metadata("design:type", Number)
], Ride.prototype, "fareAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'XOF' }),
    __metadata("design:type", String)
], Ride.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'payment_method',
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.CASH,
    }),
    __metadata("design:type", String)
], Ride.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'payment_status',
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    }),
    __metadata("design:type", String)
], Ride.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'accepted_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Ride.prototype, "acceptedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Ride.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Ride.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancelled_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Ride.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'cancelled_by',
        type: 'enum',
        enum: CancelledBy,
        nullable: true,
    }),
    __metadata("design:type", String)
], Ride.prototype, "cancelledBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'cancel_reason',
        type: 'enum',
        enum: CancelReason,
        nullable: true,
    }),
    __metadata("design:type", String)
], Ride.prototype, "cancelReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancel_note', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Ride.prototype, "cancelNote", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'declared_value',
        type: 'numeric',
        precision: 12,
        scale: 0,
        nullable: true,
    }),
    __metadata("design:type", Number)
], Ride.prototype, "declaredValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parcel_description', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Ride.prototype, "parcelDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recipient_name', nullable: true }),
    __metadata("design:type", String)
], Ride.prototype, "recipientName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recipient_phone', length: 20, nullable: true }),
    __metadata("design:type", String)
], Ride.prototype, "recipientPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'parcel_size',
        type: 'enum',
        enum: ParcelSize,
        nullable: true,
    }),
    __metadata("design:type", String)
], Ride.prototype, "parcelSize", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'required_trust_level',
        type: 'smallint',
        nullable: true,
    }),
    __metadata("design:type", Number)
], Ride.prototype, "requiredTrustLevel", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'merchant_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Ride.prototype, "merchantId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Ride.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Ride.prototype, "updatedAt", void 0);
exports.Ride = Ride = __decorate([
    (0, typeorm_1.Entity)('rides')
], Ride);
//# sourceMappingURL=ride.entity.js.map