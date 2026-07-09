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
exports.TrustService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const trust_level_1 = require("../../common/trust-level");
const driver_profile_entity_1 = require("../users/entities/driver-profile.entity");
const guarantor_entity_1 = require("./entities/guarantor.entity");
const partner_company_entity_1 = require("./entities/partner-company.entity");
const trust_config_entity_1 = require("./entities/trust-config.entity");
const DEFAULT_CONFIGS = [
    { trustLevel: trust_level_1.TrustLevel.KYC_SIMPLE, label: 'KYC simple', maxDeclaredValue: 50000 },
    { trustLevel: trust_level_1.TrustLevel.REFERENCED, label: 'Référencé individuel', maxDeclaredValue: 500000 },
    { trustLevel: trust_level_1.TrustLevel.ENTERPRISE, label: 'Entreprise partenaire', maxDeclaredValue: null },
];
let TrustService = class TrustService {
    constructor(guarantors, companies, configs, profiles) {
        this.guarantors = guarantors;
        this.companies = companies;
        this.configs = configs;
        this.profiles = profiles;
    }
    async onModuleInit() {
        for (const cfg of DEFAULT_CONFIGS) {
            const existing = await this.configs.findOne({
                where: { trustLevel: cfg.trustLevel },
            });
            if (!existing) {
                await this.configs.save(this.configs.create(cfg));
            }
        }
    }
    async getRequiredTrustLevel(declaredValue) {
        const configs = await this.configs.find({ order: { trustLevel: 'ASC' } });
        for (const cfg of configs) {
            if (cfg.maxDeclaredValue === null)
                return cfg.trustLevel;
            if (declaredValue <= Number(cfg.maxDeclaredValue))
                return cfg.trustLevel;
        }
        return trust_level_1.TrustLevel.ENTERPRISE;
    }
    async computeTrustLevel(profile) {
        if (profile.partnerCompanyId) {
            const company = await this.companies.findOne({
                where: { id: profile.partnerCompanyId },
            });
            if (company && company.status === partner_company_entity_1.CompanyStatus.ACTIVE) {
                return trust_level_1.TrustLevel.ENTERPRISE;
            }
        }
        if (profile.guarantorId) {
            const guarantor = await this.guarantors.findOne({
                where: { id: profile.guarantorId },
            });
            if (guarantor && guarantor.isVerified && guarantor.isActive) {
                return trust_level_1.TrustLevel.REFERENCED;
            }
        }
        if (profile.kycStatus === driver_profile_entity_1.KycStatus.APPROVED) {
            return trust_level_1.TrustLevel.KYC_SIMPLE;
        }
        return trust_level_1.TrustLevel.NONE;
    }
    async refreshTrustLevel(userId) {
        const profile = await this.profiles.findOne({ where: { userId } });
        if (!profile)
            return trust_level_1.TrustLevel.NONE;
        const level = await this.computeTrustLevel(profile);
        if (profile.trustLevel !== level) {
            profile.trustLevel = level;
            await this.profiles.save(profile);
        }
        return level;
    }
    async filterByTrustLevel(userIds, minLevel) {
        if (minLevel <= trust_level_1.TrustLevel.NONE)
            return userIds;
        if (userIds.length === 0)
            return [];
        const rows = await this.profiles
            .createQueryBuilder('p')
            .select('p.user_id', 'userId')
            .where('p.user_id IN (:...userIds)', { userIds })
            .andWhere('p.trust_level >= :minLevel', { minLevel })
            .getRawMany();
        return rows.map((r) => r.userId);
    }
    async refreshMany(userIds) {
        for (const userId of userIds) {
            await this.refreshTrustLevel(userId);
        }
    }
    async handleKycApproved(payload) {
        await this.refreshTrustLevel(payload.userId);
    }
    createGuarantor(dto) {
        return this.guarantors.save(this.guarantors.create(dto));
    }
    listGuarantors() {
        return this.guarantors.find({ order: { createdAt: 'DESC' } });
    }
    async updateGuarantor(id, dto) {
        const guarantor = await this.guarantors.findOne({ where: { id } });
        if (!guarantor)
            throw new common_1.NotFoundException('Guarantor not found');
        Object.assign(guarantor, dto);
        const saved = await this.guarantors.save(guarantor);
        await this.refreshReferredDrivers(id);
        return saved;
    }
    async verifyGuarantor(id, verified) {
        const guarantor = await this.guarantors.findOne({ where: { id } });
        if (!guarantor)
            throw new common_1.NotFoundException('Guarantor not found');
        guarantor.isVerified = verified;
        const saved = await this.guarantors.save(guarantor);
        await this.refreshReferredDrivers(id);
        return saved;
    }
    async refreshReferredDrivers(guarantorId) {
        const drivers = await this.profiles.find({ where: { guarantorId } });
        await this.refreshMany(drivers.map((d) => d.userId));
    }
    createCompany(dto) {
        return this.companies.save(this.companies.create(dto));
    }
    listCompanies() {
        return this.companies.find({ order: { createdAt: 'DESC' } });
    }
    async updateCompany(id, dto) {
        const company = await this.companies.findOne({ where: { id } });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        Object.assign(company, {
            ...dto,
            subscriptionExpiresAt: dto.subscriptionExpiresAt
                ? new Date(dto.subscriptionExpiresAt)
                : company.subscriptionExpiresAt,
        });
        const saved = await this.companies.save(company);
        await this.refreshCompanyDrivers(id);
        return saved;
    }
    async refreshCompanyDrivers(companyId) {
        const drivers = await this.profiles.find({
            where: { partnerCompanyId: companyId },
        });
        await this.refreshMany(drivers.map((d) => d.userId));
    }
    async assign(dto) {
        const profile = await this.profiles.findOne({
            where: { userId: dto.driverUserId },
        });
        if (!profile)
            throw new common_1.NotFoundException('Driver profile not found');
        if (dto.guarantorId !== undefined) {
            profile.guarantorId = dto.guarantorId ?? undefined;
        }
        if (dto.partnerCompanyId !== undefined) {
            profile.partnerCompanyId = dto.partnerCompanyId ?? undefined;
        }
        await this.profiles.save(profile);
        await this.refreshTrustLevel(dto.driverUserId);
        return this.profiles.findOne({
            where: { userId: dto.driverUserId },
        });
    }
    listConfig() {
        return this.configs.find({ order: { trustLevel: 'ASC' } });
    }
    async updateConfig(dto) {
        const config = await this.configs.findOne({
            where: { trustLevel: dto.trustLevel },
        });
        if (!config)
            throw new common_1.NotFoundException('Trust config not found');
        config.maxDeclaredValue = dto.maxDeclaredValue;
        return this.configs.save(config);
    }
};
exports.TrustService = TrustService;
__decorate([
    (0, event_emitter_1.OnEvent)('kyc.approved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TrustService.prototype, "handleKycApproved", null);
exports.TrustService = TrustService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(guarantor_entity_1.Guarantor)),
    __param(1, (0, typeorm_1.InjectRepository)(partner_company_entity_1.PartnerCompany)),
    __param(2, (0, typeorm_1.InjectRepository)(trust_config_entity_1.TrustConfig)),
    __param(3, (0, typeorm_1.InjectRepository)(driver_profile_entity_1.DriverProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TrustService);
//# sourceMappingURL=trust.service.js.map