"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ride_entity_1 = require("../rides/entities/ride.entity");
const rental_booking_entity_1 = require("../rentals/entities/rental-booking.entity");
const driver_profile_entity_1 = require("../users/entities/driver-profile.entity");
const rating_entity_1 = require("./entities/rating.entity");
const rental_rating_entity_1 = require("./entities/rental-rating.entity");
const ratings_controller_1 = require("./ratings.controller");
const rental_ratings_controller_1 = require("./rental-ratings.controller");
const ratings_service_1 = require("./ratings.service");
let RatingsModule = class RatingsModule {
};
exports.RatingsModule = RatingsModule;
exports.RatingsModule = RatingsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                rating_entity_1.Rating,
                rental_rating_entity_1.RentalRating,
                ride_entity_1.Ride,
                rental_booking_entity_1.RentalBooking,
                driver_profile_entity_1.DriverProfile,
            ]),
        ],
        controllers: [ratings_controller_1.RatingsController, rental_ratings_controller_1.RentalRatingsController],
        providers: [ratings_service_1.RatingsService],
        exports: [ratings_service_1.RatingsService],
    })
], RatingsModule);
//# sourceMappingURL=ratings.module.js.map