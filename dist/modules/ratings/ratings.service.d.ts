import { Repository } from 'typeorm';
import { DriverProfile } from '../users/entities/driver-profile.entity';
import { Ride } from '../rides/entities/ride.entity';
import { RentalBooking } from '../rentals/entities/rental-booking.entity';
import { Rating } from './entities/rating.entity';
import { RentalRating } from './entities/rental-rating.entity';
export declare class RatingsService {
    private readonly ratings;
    private readonly rides;
    private readonly rentalRatings;
    private readonly bookings;
    private readonly profiles;
    constructor(ratings: Repository<Rating>, rides: Repository<Ride>, rentalRatings: Repository<RentalRating>, bookings: Repository<RentalBooking>, profiles: Repository<DriverProfile>);
    rate(rideId: string, raterId: string, score: number, comment?: string): Promise<Rating>;
    mine(rideId: string, raterId: string): Promise<Rating | null>;
    rateRental(bookingId: string, raterId: string, score: number, comment?: string): Promise<RentalRating>;
    myRentalRating(bookingId: string, raterId: string): Promise<RentalRating | null>;
    private recomputeDriverAverage;
}
