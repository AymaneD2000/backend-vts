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
exports.MerchantsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/current-user.decorator");
const roles_decorator_1 = require("../../common/roles.decorator");
const roles_guard_1 = require("../../common/roles.guard");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const user_entity_1 = require("../users/entities/user.entity");
const create_delivery_dto_1 = require("./dto/create-delivery.dto");
const create_merchant_dto_1 = require("./dto/create-merchant.dto");
const update_merchant_dto_1 = require("./dto/update-merchant.dto");
const merchants_service_1 = require("./merchants.service");
let MerchantsController = class MerchantsController {
    constructor(merchants) {
        this.merchants = merchants;
    }
    create(dto) {
        return this.merchants.create(dto);
    }
    list() {
        return this.merchants.list();
    }
    update(id, dto) {
        return this.merchants.update(id, dto);
    }
    mine(userId) {
        return this.merchants.myMerchants(userId);
    }
    createDelivery(userId, dto) {
        return this.merchants.createDelivery(userId, dto);
    }
    myDeliveries(userId) {
        return this.merchants.myDeliveries(userId);
    }
    dispatchDelivery(userId, id) {
        return this.merchants.dispatchDelivery(userId, id);
    }
};
exports.MerchantsController = MerchantsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_merchant_dto_1.CreateMerchantDto]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "list", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_merchant_dto_1.UpdateMerchantDto]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)('mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "mine", null);
__decorate([
    (0, common_1.Post)('mine/deliveries'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_delivery_dto_1.CreateDeliveryDto]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "createDelivery", null);
__decorate([
    (0, common_1.Get)('mine/deliveries'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "myDeliveries", null);
__decorate([
    (0, common_1.Post)('mine/deliveries/:id/dispatch'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "dispatchDelivery", null);
exports.MerchantsController = MerchantsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('merchants'),
    __metadata("design:paramtypes", [merchants_service_1.MerchantsService])
], MerchantsController);
//# sourceMappingURL=merchants.controller.js.map