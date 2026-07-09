import { DriversService } from './drivers.service';
import { GoOnlineDto, LocationDto } from './dto/driver.dto';
export declare class DriversController {
    private readonly drivers;
    constructor(drivers: DriversService);
    status(userId: string): Promise<{
        ready: boolean;
        isAvailable: boolean;
        canReceiveRides: boolean;
        kycStatus: import("../users/entities/driver-profile.entity").KycStatus;
        vehicleType: import("../users/entities/driver-profile.entity").VehicleType | null;
        vehiclePlate: string | null;
        vehicleMake: string | null;
        vehicleModel: string | null;
        vehicleColor: string | null;
        vehicleYear: number | null;
    }>;
    summary(userId: string): Promise<{
        todayRides: number;
        todayEarnings: number;
        currency: string;
        rating: number | null;
        ratingCount: number;
    }>;
    goOnline(userId: string, dto: GoOnlineDto): Promise<import("../users/entities/driver-profile.entity").DriverProfile>;
    goOffline(userId: string): Promise<{
        message: string;
    }>;
    updateLocation(userId: string, dto: LocationDto): Promise<{
        message: string;
    }>;
}
