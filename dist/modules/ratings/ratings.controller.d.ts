import { RateDto } from './dto/rate.dto';
import { RatingsService } from './ratings.service';
export declare class RatingsController {
    private readonly ratings;
    constructor(ratings: RatingsService);
    rate(userId: string, rideId: string, dto: RateDto): Promise<import("./entities/rating.entity").Rating>;
    mine(userId: string, rideId: string): Promise<import("./entities/rating.entity").Rating | null>;
}
