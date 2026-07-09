"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const driver_profile_entity_1 = require("../users/entities/driver-profile.entity");
const guarantor_entity_1 = require("./entities/guarantor.entity");
const partner_company_entity_1 = require("./entities/partner-company.entity");
const trust_config_entity_1 = require("./entities/trust-config.entity");
const trust_controller_1 = require("./trust.controller");
const trust_service_1 = require("./trust.service");
let TrustModule = class TrustModule {
};
exports.TrustModule = TrustModule;
exports.TrustModule = TrustModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                guarantor_entity_1.Guarantor,
                partner_company_entity_1.PartnerCompany,
                trust_config_entity_1.TrustConfig,
                driver_profile_entity_1.DriverProfile,
            ]),
        ],
        controllers: [trust_controller_1.TrustController],
        providers: [trust_service_1.TrustService],
        exports: [trust_service_1.TrustService],
    })
], TrustModule);
//# sourceMappingURL=trust.module.js.map