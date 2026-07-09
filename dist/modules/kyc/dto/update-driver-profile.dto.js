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
exports.UpdateDriverProfileDto = void 0;
const class_validator_1 = require("class-validator");
const driver_profile_entity_1 = require("../../users/entities/driver-profile.entity");
class UpdateDriverProfileDto {
}
exports.UpdateDriverProfileDto = UpdateDriverProfileDto;
__decorate([
    (0, class_validator_1.IsEnum)(driver_profile_entity_1.VehicleType),
    __metadata("design:type", String)
], UpdateDriverProfileDto.prototype, "vehicleType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 32),
    __metadata("design:type", String)
], UpdateDriverProfileDto.prototype, "vehiclePlate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 60),
    __metadata("design:type", String)
], UpdateDriverProfileDto.prototype, "vehicleMake", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 60),
    __metadata("design:type", String)
], UpdateDriverProfileDto.prototype, "vehicleModel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 40),
    __metadata("design:type", String)
], UpdateDriverProfileDto.prototype, "vehicleColor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1980),
    (0, class_validator_1.Max)(2100),
    __metadata("design:type", Number)
], UpdateDriverProfileDto.prototype, "vehicleYear", void 0);
//# sourceMappingURL=update-driver-profile.dto.js.map