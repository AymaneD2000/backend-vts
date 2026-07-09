import { LatLng } from '../../common/geo';
import { ServiceType } from '../../common/service-type';
import { DriverPresenceService, NearbyDriver } from '../drivers/driver-presence.service';
import { VehicleType } from '../users/entities/driver-profile.entity';
export declare class MatchingService {
    private readonly presence;
    constructor(presence: DriverPresenceService);
    vehicleTypeFor(serviceType: ServiceType): VehicleType;
    findCandidates(serviceType: ServiceType, pickup: LatLng, radiusM?: number, count?: number): Promise<NearbyDriver[]>;
    findNearest(serviceType: ServiceType, pickup: LatLng, radiusM?: number): Promise<NearbyDriver | null>;
}
