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
exports.RatingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const driver_profile_entity_1 = require("../users/entities/driver-profile.entity");
const ride_entity_1 = require("../rides/entities/ride.entity");
const rental_booking_entity_1 = require("../rentals/entities/rental-booking.entity");
const rating_entity_1 = require("./entities/rating.entity");
const rental_rating_entity_1 = require("./entities/rental-rating.entity");
let RatingsService = class RatingsService {
    constructor(ratings, rides, rentalRatings, bookings, profiles) {
        this.ratings = ratings;
        this.rides = rides;
        this.rentalRatings = rentalRatings;
        this.bookings = bookings;
        this.profiles = profiles;
    }
    async rate(rideId, raterId, score, comment) {
        const ride = await this.rides.findOne({ where: { id: rideId } });
        if (!ride)
            throw new common_1.NotFoundException('Ride not found');
        const isClient = ride.clientId === raterId;
        const isDriver = ride.driverId === raterId;
        if (!isClient && !isDriver) {
            throw new common_1.ForbiddenException('Not your ride');
        }
        if (ride.status !== ride_entity_1.RideStatus.COMPLETED) {
            throw new common_1.BadRequestException('Can only rate a completed ride');
        }
        const rateeId = isClient ? ride.driverId : ride.clientId;
        if (!rateeId) {
            throw new common_1.BadRequestException('Ride has no counterpart to rate');
        }
        const existing = await this.ratings.findOne({
            where: { rideId, raterId },
        });
        if (existing) {
            throw new common_1.ConflictException('You already rated this ride');
        }
        const rating = await this.ratings.save(this.ratings.create({ rideId, raterId, rateeId, score, comment }));
        if (isClient) {
            await this.recomputeDriverAverage(rateeId);
        }
        return rating;
    }
    async mine(rideId, raterId) {
        return this.ratings.findOne({ where: { rideId, raterId } });
    }
    async rateRental(bookingId, raterId, score, comment) {
        const booking = await this.bookings.findOne({ where: { id: bookingId } });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        const isClient = booking.clientId === raterId;
        const isDriver = booking.driverId === raterId;
        if (!isClient && !isDriver) {
            throw new common_1.ForbiddenException('Not your booking');
        }
        if (booking.status !== rental_booking_entity_1.RentalStatus.COMPLETED) {
            throw new common_1.BadRequestException('Can only rate a completed rental');
        }
        const rateeId = isClient ? booking.driverId : booking.clientId;
        if (!rateeId) {
            throw new common_1.BadRequestException('Booking has no counterpart to rate');
        }
        const existing = await this.rentalRatings.findOne({
            where: { rentalBookingId: bookingId, raterId },
        });
        if (existing) {
            throw new common_1.ConflictException('You already rated this rental');
        }
        const rating = await this.rentalRatings.save(this.rentalRatings.create({
            rentalBookingId: bookingId,
            raterId,
            rateeId,
            score,
            comment,
        }));
        if (isClient) {
            await this.recomputeDriverAverage(rateeId);
        }
        return rating;
    }
    async myRentalRating(bookingId, raterId) {
        return this.rentalRatings.findOne({
            where: { rentalBookingId: bookingId, raterId },
        });
    }
    async recomputeDriverAverage(driverId) {
        const ride = await this.ratings
            .createQueryBuilder('r')
            .select('SUM(r.score)', 'sum')
            .addSelect('COUNT(r.id)', 'count')
            .where('r.ratee_id = :driverId', { driverId })
            .getRawOne();
        const rental = await this.rentalRatings
            .createQueryBuilder('r')
            .select('SUM(r.score)', 'sum')
            .addSelect('COUNT(r.id)', 'count')
            .where('r.ratee_id = :driverId', { driverId })
            .getRawOne();
        const sum = parseFloat(ride?.sum ?? '0') + parseFloat(rental?.sum ?? '0');
        const count = parseInt(ride?.count ?? '0', 10) + parseInt(rental?.count ?? '0', 10);
        const ratingAvg = count > 0 ? Number((sum / count).toFixed(2)) : 0;
        await this.profiles.update({ userId: driverId }, { ratingAvg });
    }
};
exports.RatingsService = RatingsService;
exports.RatingsService = RatingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(rating_entity_1.Rating)),
    __param(1, (0, typeorm_1.InjectRepository)(ride_entity_1.Ride)),
    __param(2, (0, typeorm_1.InjectRepository)(rental_rating_entity_1.RentalRating)),
    __param(3, (0, typeorm_1.InjectRepository)(rental_booking_entity_1.RentalBooking)),
    __param(4, (0, typeorm_1.InjectRepository)(driver_profile_entity_1.DriverProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RatingsService);
//# sourceMappingURL=ratings.service.js.map