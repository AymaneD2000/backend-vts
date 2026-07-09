import { Ride } from '../../rides/entities/ride.entity';
export declare class Rating {
    id: string;
    ride: Ride;
    rideId: string;
    raterId: string;
    rateeId: string;
    score: number;
    comment?: string;
    createdAt: Date;
}
