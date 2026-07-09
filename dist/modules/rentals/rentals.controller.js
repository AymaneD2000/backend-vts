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
exports.RentalsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/current-user.decorator");
const roles_decorator_1 = require("../../common/roles.decorator");
const roles_guard_1 = require("../../common/roles.guard");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const user_entity_1 = require("../users/entities/user.entity");
const cancel_booking_dto_1 = require("./dto/cancel-booking.dto");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const create_rental_vehicle_dto_1 = require("./dto/create-rental-vehicle.dto");
const update_rental_vehicle_dto_1 = require("./dto/update-rental-vehicle.dto");
const rentals_service_1 = require("./rentals.service");
let RentalsController = class RentalsController {
    constructor(rentals) {
        this.rentals = rentals;
    }
    createVehicle(dto) {
        return this.rentals.createVehicle(dto);
    }
    listVehicles() {
        return this.rentals.listVehicles();
    }
    updateVehicle(id, dto) {
        return this.rentals.updateVehicle(id, dto);
    }
    listAllBookings() {
        return this.rentals.listBookings();
    }
    catalog() {
        return this.rentals.listCatalog();
    }
    book(userId, dto) {
        return this.rentals.book(userId, dto);
    }
    myBookings(userId) {
        return this.rentals.myBookings(userId);
    }
    get(userId, id) {
        return this.rentals.get(id, userId);
    }
    cancel(userId, id, dto) {
        return this.rentals.cancel(id, userId, dto);
    }
    pending() {
        return this.rentals.listPending();
    }
    accept(userId, id) {
        return this.rentals.accept(id, userId);
    }
    start(userId, id) {
        return this.rentals.start(id, userId);
    }
    complete(userId, id) {
        return this.rentals.complete(id, userId);
    }
};
exports.RentalsController = RentalsController;
__decorate([
    (0, common_1.Post)('vehicles'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_rental_vehicle_dto_1.CreateRentalVehicleDto]),
    __metadata("design:returntype", void 0)
], RentalsController.prototype, "createVehicle", null);
__decorate([
    (0, common_1.Get)('vehicles'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RentalsController.prototype, "listVehicles", null);
__decorate([
    (0, common_1.Patch)('vehicles/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_rental_vehicle_dto_1.UpdateRentalVehicleDto]),
    __metadata("design:returntype", void 0)
], RentalsController.prototype, "updateVehicle", null);
__decorate([
    (0, common_1.Get)('bookings/all'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RentalsController.prototype, "listAllBookings", null);
__decorate([
    (0, common_1.Get)('catalog'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RentalsController.prototype, "catalog", null);
__decorate([
    (0, common_1.Post)('bookings'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", void 0)
], RentalsController.prototype, "book", null);
__decorate([
    (0, common_1.Get)('bookings/mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RentalsController.prototype, "myBookings", null);
__decorate([
    (0, common_1.Get)('bookings/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RentalsController.prototype, "get", null);
__decorate([
    (0, common_1.Post)('bookings/:id/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, cancel_booking_dto_1.CancelBookingDto]),
    __metadata("design:returntype", void 0)
], RentalsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)('pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RentalsController.prototype, "pending", null);
__decorate([
    (0, common_1.Post)('bookings/:id/accept'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RentalsController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)('bookings/:id/start'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RentalsController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('bookings/:id/complete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RentalsController.prototype, "complete", null);
exports.RentalsController = RentalsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('rentals'),
    __metadata("design:paramtypes", [rentals_service_1.RentalsService])
], RentalsController);
//# sourceMappingURL=rentals.controller.js.map