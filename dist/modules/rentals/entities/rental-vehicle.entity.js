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
exports.RentalVehicle = exports.RentalCategory = void 0;
const typeorm_1 = require("typeorm");
var RentalCategory;
(function (RentalCategory) {
    RentalCategory["MOTO"] = "moto";
    RentalCategory["CAR"] = "car";
    RentalCategory["TRICYCLE"] = "tricycle";
})(RentalCategory || (exports.RentalCategory = RentalCategory = {}));
let RentalVehicle = class RentalVehicle {
};
exports.RentalVehicle = RentalVehicle;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RentalVehicle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RentalVehicle.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: RentalCategory }),
    __metadata("design:type", String)
], RentalVehicle.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'daily_price', type: 'numeric', precision: 12, scale: 0 }),
    __metadata("design:type", Number)
], RentalVehicle.prototype, "dailyPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], RentalVehicle.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', nullable: true }),
    __metadata("design:type", String)
], RentalVehicle.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], RentalVehicle.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_available', default: true }),
    __metadata("design:type", Boolean)
], RentalVehicle.prototype, "isAvailable", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], RentalVehicle.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], RentalVehicle.prototype, "updatedAt", void 0);
exports.RentalVehicle = RentalVehicle = __decorate([
    (0, typeorm_1.Entity)('rental_vehicles')
], RentalVehicle);
//# sourceMappingURL=rental-vehicle.entity.js.map