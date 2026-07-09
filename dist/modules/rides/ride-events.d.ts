import { VehicleType } from '../users/entities/driver-profile.entity';
import { Ride } from './entities/ride.entity';
export declare const RIDE_UPDATED = "ride.updated";
export interface RideUpdatedEvent {
    ride: Ride;
}
export declare const RIDE_OFFERED = "ride.offered";
export interface RideOfferedEvent {
    ride: Ride;
    driverIds: string[];
}
export declare const RIDE_TAKEN = "ride.taken";
export interface RideTakenEvent {
    rideId: string;
    driverIds: string[];
}
export declare const DRIVER_ONLINE = "driver.online";
export interface DriverOnlineEvent {
    driverId: string;
    vehicleType: VehicleType;
    lat: number;
    lng: number;
}
