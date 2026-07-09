"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const app_controller_1 = require("./app.controller");
const configuration_1 = __importDefault(require("./config/configuration"));
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./modules/auth/auth.module");
const drivers_module_1 = require("./modules/drivers/drivers.module");
const kyc_module_1 = require("./modules/kyc/kyc.module");
const matching_module_1 = require("./modules/matching/matching.module");
const merchants_module_1 = require("./modules/merchants/merchants.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const pricing_module_1 = require("./modules/pricing/pricing.module");
const ratings_module_1 = require("./modules/ratings/ratings.module");
const realtime_module_1 = require("./modules/realtime/realtime.module");
const rentals_module_1 = require("./modules/rentals/rentals.module");
const rides_module_1 = require("./modules/rides/rides.module");
const trust_module_1 = require("./modules/trust/trust.module");
const users_module_1 = require("./modules/users/users.module");
const redis_module_1 = require("./redis/redis.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
            }),
            event_emitter_1.EventEmitterModule.forRoot(),
            database_module_1.DatabaseModule,
            redis_module_1.RedisModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            pricing_module_1.PricingModule,
            drivers_module_1.DriversModule,
            matching_module_1.MatchingModule,
            rides_module_1.RidesModule,
            realtime_module_1.RealtimeModule,
            notifications_module_1.NotificationsModule,
            ratings_module_1.RatingsModule,
            kyc_module_1.KycModule,
            trust_module_1.TrustModule,
            rentals_module_1.RentalsModule,
            merchants_module_1.MerchantsModule,
        ],
        controllers: [app_controller_1.AppController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map