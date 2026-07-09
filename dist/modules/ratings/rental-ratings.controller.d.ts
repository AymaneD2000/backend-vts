import { RateDto } from './dto/rate.dto';
import { RatingsService } from './ratings.service';
export declare class RentalRatingsController {
    private readonly ratings;
    constructor(ratings: RatingsService);
    rate(userId: string, bookingId: string, dto: RateDto): Promise<import("./entities/rental-rating.entity").RentalRating>;
    mine(userId: string, bookingId: string): Promise<import("./entities/rental-rating.entity").RentalRating | null>;
}
