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
exports.PartnerCompany = exports.CompanyStatus = exports.CompanyType = void 0;
const typeorm_1 = require("typeorm");
var CompanyType;
(function (CompanyType) {
    CompanyType["SUBSCRIBER"] = "subscriber";
    CompanyType["GUARANTOR"] = "guarantor";
    CompanyType["BOTH"] = "both";
})(CompanyType || (exports.CompanyType = CompanyType = {}));
var CompanyStatus;
(function (CompanyStatus) {
    CompanyStatus["PENDING"] = "pending";
    CompanyStatus["ACTIVE"] = "active";
    CompanyStatus["SUSPENDED"] = "suspended";
})(CompanyStatus || (exports.CompanyStatus = CompanyStatus = {}));
let PartnerCompany = class PartnerCompany {
};
exports.PartnerCompany = PartnerCompany;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PartnerCompany.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PartnerCompany.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'company_type',
        type: 'enum',
        enum: CompanyType,
        default: CompanyType.BOTH,
    }),
    __metadata("design:type", String)
], PartnerCompany.prototype, "companyType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CompanyStatus,
        default: CompanyStatus.PENDING,
    }),
    __metadata("design:type", String)
], PartnerCompany.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'manager_user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PartnerCompany.prototype, "managerUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contract_ref', nullable: true }),
    __metadata("design:type", String)
], PartnerCompany.prototype, "contractRef", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PartnerCompany.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PartnerCompany.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'subscription_expires_at',
        type: 'timestamptz',
        nullable: true,
    }),
    __metadata("design:type", Date)
], PartnerCompany.prototype, "subscriptionExpiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PartnerCompany.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PartnerCompany.prototype, "updatedAt", void 0);
exports.PartnerCompany = PartnerCompany = __decorate([
    (0, typeorm_1.Entity)('partner_companies')
], PartnerCompany);
//# sourceMappingURL=partner-company.entity.js.map