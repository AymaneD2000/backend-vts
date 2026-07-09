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
exports.DriverProfile = exports.VehicleType = exports.KycStatus = void 0;
const typeorm_1 = require("typeorm");
const trust_level_1 = require("../../../common/trust-level");
const user_entity_1 = require("./user.entity");
var KycStatus;
(function (KycStatus) {
    KycStatus["PENDING"] = "pending";
    KycStatus["SUBMITTED"] = "submitted";
    KycStatus["APPROVED"] = "approved";
    KycStatus["REJECTED"] = "rejected";
})(KycStatus || (exports.KycStatus = KycStatus = {}));
var VehicleType;
(function (VehicleType) {
    VehicleType["CAR"] = "car";
    VehicleType["MOTO"] = "moto";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
let DriverProfile = class DriverProfile {
};
exports.DriverProfile = DriverProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DriverProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.driverProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], DriverProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], DriverProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'kyc_status',
        type: 'enum',
        enum: KycStatus,
        default: KycStatus.PENDING,
    }),
    __metadata("design:type", String)
], DriverProfile.prototype, "kycStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'kyc_rejection_reason', type: 'text', nullable: true }),
    __metadata("design:type", String)
], DriverProfile.prototype, "kycRejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'trust_level',
        type: 'smallint',
        default: trust_level_1.TrustLevel.NONE,
    }),
    __metadata("design:type", Number)
], DriverProfile.prototype, "trustLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'guarantor_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], DriverProfile.prototype, "guarantorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'partner_company_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], DriverProfile.prototype, "partnerCompanyId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'vehicle_type',
        type: 'enum',
        enum: VehicleType,
        nullable: true,
    }),
    __metadata("design:type", String)
], DriverProfile.prototype, "vehicleType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vehicle_plate', nullable: true }),
    __metadata("design:type", String)
], DriverProfile.prototype, "vehiclePlate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vehicle_make', nullable: true }),
    __metadata("design:type", String)
], DriverProfile.prototype, "vehicleMake", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vehicle_model', nullable: true }),
    __metadata("design:type", String)
], DriverProfile.prototype, "vehicleModel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vehicle_color', nullable: true }),
    __metadata("design:type", String)
], DriverProfile.prototype, "vehicleColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vehicle_year', type: 'smallint', nullable: true }),
    __metadata("design:type", Number)
], DriverProfile.prototype, "vehicleYear", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_available', default: false }),
    __metadata("design:type", Boolean)
], DriverProfile.prototype, "isAvailable", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_lat', type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], DriverProfile.prototype, "lastLat", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_lng', type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], DriverProfile.prototype, "lastLng", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rating_avg', type: 'numeric', precision: 3, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DriverProfile.prototype, "ratingAvg", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DriverProfile.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], DriverProfile.prototype, "updatedAt", void 0);
exports.DriverProfile = DriverProfile = __decorate([
    (0, typeorm_1.Entity)('driver_profiles')
], DriverProfile);
//# sourceMappingURL=driver-profile.entity.js.map