import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { LatLng } from '../../common/geo';
import { Rating } from '../ratings/entities/rating.entity';
import { Ride } from '../rides/entities/ride.entity';
import { DriverProfile, KycStatus } from '../users/entities/driver-profile.entity';
import { UsersService } from '../users/users.service';
import { DriverPresenceService } from './driver-presence.service';
export declare class DriversService {
    private readonly profiles;
    private readonly rides;
    private readonly ratings;
    private readonly presence;
    private readonly users;
    private readonly events;
    constructor(profiles: Repository<DriverProfile>, rides: Repository<Ride>, ratings: Repository<Rating>, presence: DriverPresenceService, users: UsersService, events: EventEmitter2);
    summary(userId: string): Promise<{
        todayRides: number;
        todayEarnings: number;
        currency: string;
        rating: number | null;
        ratingCount: number;
    }>;
    getOrCreateProfile(userId: string): Promise<DriverProfile>;
    status(userId: string): Promise<{
        ready: boolean;
        isAvailable: boolean;
        canReceiveRides: boolean;
        kycStatus: KycStatus;
        vehicleType: import("../users/entities/driver-profile.entity").VehicleType | null;
        vehiclePlate: string | null;
        vehicleMake: string | null;
        vehicleModel: string | null;
        vehicleColor: string | null;
        vehicleYear: number | null;
    }>;
    goOnline(userId: string, pos: LatLng): Promise<DriverProfile>;
    goOffline(userId: string): Promise<void>;
    updateLocation(userId: string, pos: LatLng): Promise<void>;
    private hasCompleteVehicleProfile;
}
