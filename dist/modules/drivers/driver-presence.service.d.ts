import Redis from 'ioredis';
import { LatLng } from '../../common/geo';
import { VehicleType } from '../users/entities/driver-profile.entity';
export interface NearbyDriver {
    userId: string;
    distanceM: number;
    lat: number;
    lng: number;
}
export declare class DriverPresenceService {
    private readonly redis;
    constructor(redis: Redis);
    private geoKey;
    private setRefKey;
    goOnline(userId: string, vehicleType: VehicleType, pos: LatLng): Promise<void>;
    updateLocation(userId: string, pos: LatLng): Promise<boolean>;
    goOffline(userId: string): Promise<void>;
    findNearby(vehicleType: VehicleType, pos: LatLng, radiusM: number, count?: number): Promise<NearbyDriver[]>;
    getPosition(userId: string): Promise<LatLng | null>;
}
