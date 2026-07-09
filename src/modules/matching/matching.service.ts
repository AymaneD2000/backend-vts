import { Injectable } from '@nestjs/common';
import { LatLng } from '../../common/geo';
import { ServiceType } from '../../common/service-type';
import {
  DriverPresenceService,
  NearbyDriver,
} from '../drivers/driver-presence.service';
import { VehicleType } from '../users/entities/driver-profile.entity';

// Default search radius for matching, in metres (Bamako-scale).
const DEFAULT_RADIUS_M = 5000;

/**
 * Service Mise en Relation (matching): finds the most suitable available
 * driver for a request via the Redis geospatial index.
 */
@Injectable()
export class MatchingService {
  constructor(private readonly presence: DriverPresenceService) {}

  /** Maps a customer-facing service to the vehicle class that fulfils it. */
  vehicleTypeFor(serviceType: ServiceType): VehicleType {
    // Moto-taxi and merchant deliveries are both served by motorcycles.
    return serviceType === ServiceType.MOTO ||
      serviceType === ServiceType.MERCHANT_DELIVERY
      ? VehicleType.MOTO
      : VehicleType.CAR;
  }

  async findCandidates(
    serviceType: ServiceType,
    pickup: LatLng,
    radiusM = DEFAULT_RADIUS_M,
    count = 5,
  ): Promise<NearbyDriver[]> {
    return this.presence.findNearby(
      this.vehicleTypeFor(serviceType),
      pickup,
      radiusM,
      count,
    );
  }

  async findNearest(
    serviceType: ServiceType,
    pickup: LatLng,
    radiusM = DEFAULT_RADIUS_M,
  ): Promise<NearbyDriver | null> {
    const candidates = await this.findCandidates(serviceType, pickup, radiusM, 1);
    return candidates[0] ?? null;
  }
}
