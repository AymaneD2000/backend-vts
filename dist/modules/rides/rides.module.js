"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RidesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const drivers_module_1 = require("../drivers/drivers.module");
const matching_module_1 = require("../matching/matching.module");
const pricing_module_1 = require("../pricing/pricing.module");
const routing_module_1 = require("../routing/routing.module");
const trust_module_1 = require("../trust/trust.module");
const ride_entity_1 = require("./entities/ride.entity");
const rides_controller_1 = require("./rides.controller");
const rides_service_1 = require("./rides.service");
let RidesModule = class RidesModule {
};
exports.RidesModule = RidesModule;
exports.RidesModule = RidesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([ride_entity_1.Ride]),
            pricing_module_1.PricingModule,
            matching_module_1.MatchingModule,
            drivers_module_1.DriversModule,
            routing_module_1.RoutingModule,
            trust_module_1.TrustModule,
        ],
        controllers: [rides_controller_1.RidesController],
        providers: [rides_service_1.RidesService],
        exports: [rides_service_1.RidesService],
    })
], RidesModule);
//# sourceMappingURL=rides.module.js.map