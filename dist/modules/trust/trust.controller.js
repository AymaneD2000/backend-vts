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
exports.TrustController = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../../common/roles.decorator");
const roles_guard_1 = require("../../common/roles.guard");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const user_entity_1 = require("../users/entities/user.entity");
const assign_trust_dto_1 = require("./dto/assign-trust.dto");
const create_guarantor_dto_1 = require("./dto/create-guarantor.dto");
const create_partner_company_dto_1 = require("./dto/create-partner-company.dto");
const update_guarantor_dto_1 = require("./dto/update-guarantor.dto");
const update_partner_company_dto_1 = require("./dto/update-partner-company.dto");
const update_trust_config_dto_1 = require("./dto/update-trust-config.dto");
const trust_service_1 = require("./trust.service");
let TrustController = class TrustController {
    constructor(trust) {
        this.trust = trust;
    }
    createGuarantor(dto) {
        return this.trust.createGuarantor(dto);
    }
    listGuarantors() {
        return this.trust.listGuarantors();
    }
    updateGuarantor(id, dto) {
        return this.trust.updateGuarantor(id, dto);
    }
    verifyGuarantor(id) {
        return this.trust.verifyGuarantor(id, true);
    }
    createCompany(dto) {
        return this.trust.createCompany(dto);
    }
    listCompanies() {
        return this.trust.listCompanies();
    }
    updateCompany(id, dto) {
        return this.trust.updateCompany(id, dto);
    }
    assign(dto) {
        return this.trust.assign(dto);
    }
    listConfig() {
        return this.trust.listConfig();
    }
    updateConfig(dto) {
        return this.trust.updateConfig(dto);
    }
};
exports.TrustController = TrustController;
__decorate([
    (0, common_1.Post)('guarantors'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_guarantor_dto_1.CreateGuarantorDto]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "createGuarantor", null);
__decorate([
    (0, common_1.Get)('guarantors'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "listGuarantors", null);
__decorate([
    (0, common_1.Patch)('guarantors/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_guarantor_dto_1.UpdateGuarantorDto]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "updateGuarantor", null);
__decorate([
    (0, common_1.Post)('guarantors/:id/verify'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "verifyGuarantor", null);
__decorate([
    (0, common_1.Post)('companies'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_partner_company_dto_1.CreatePartnerCompanyDto]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "createCompany", null);
__decorate([
    (0, common_1.Get)('companies'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "listCompanies", null);
__decorate([
    (0, common_1.Patch)('companies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_partner_company_dto_1.UpdatePartnerCompanyDto]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "updateCompany", null);
__decorate([
    (0, common_1.Post)('assign'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assign_trust_dto_1.AssignTrustDto]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "assign", null);
__decorate([
    (0, common_1.Get)('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "listConfig", null);
__decorate([
    (0, common_1.Patch)('config'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_trust_config_dto_1.UpdateTrustConfigDto]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "updateConfig", null);
exports.TrustController = TrustController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.Controller)('trust'),
    __metadata("design:paramtypes", [trust_service_1.TrustService])
], TrustController);
//# sourceMappingURL=trust.controller.js.map