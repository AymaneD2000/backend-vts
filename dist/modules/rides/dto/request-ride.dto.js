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
exports.RequestRideDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const service_type_1 = require("../../../common/service-type");
const ride_entity_1 = require("../entities/ride.entity");
class PlaceDto {
}
__decorate([
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], PlaceDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], PlaceDto.prototype, "lng", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlaceDto.prototype, "address", void 0);
class RequestRideDto {
}
exports.RequestRideDto = RequestRideDto;
__decorate([
    (0, class_validator_1.IsEnum)(service_type_1.ServiceType),
    __metadata("design:type", String)
], RequestRideDto.prototype, "serviceType", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PlaceDto),
    __metadata("design:type", PlaceDto)
], RequestRideDto.prototype, "pickup", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PlaceDto),
    __metadata("design:type", PlaceDto)
], RequestRideDto.prototype, "dropoff", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ride_entity_1.PaymentMethod),
    __metadata("design:type", String)
], RequestRideDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.serviceType === service_type_1.ServiceType.PARCEL),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RequestRideDto.prototype, "declaredValue", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.serviceType === service_type_1.ServiceType.PARCEL),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], RequestRideDto.prototype, "parcelDescription", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.serviceType === service_type_1.ServiceType.PARCEL),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], RequestRideDto.prototype, "recipientName", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.serviceType === service_type_1.ServiceType.PARCEL),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], RequestRideDto.prototype, "recipientPhone", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.serviceType === service_type_1.ServiceType.PARCEL),
    (0, class_validator_1.IsEnum)(ride_entity_1.ParcelSize),
    __metadata("design:type", String)
], RequestRideDto.prototype, "parcelSize", void 0);
//# sourceMappingURL=request-ride.dto.js.map