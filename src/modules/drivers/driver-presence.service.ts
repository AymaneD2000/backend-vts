import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { LatLng } from '../../common/geo';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { VehicleType } from '../users/entities/driver-profile.entity';

export interface NearbyDriver {
  userId: string;
  distanceM: number;
  lat: number;
  lng: number;
}

/**
 * Tracks live driver positions in Redis using geospatial sorted sets, one per
 * vehicle type (drivers:available:car / :moto). This powers fast nearest-driver
 * lookups via GEOSEARCH, as described in the architecture document.
 */
@Injectable()
export class DriverPresenceService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private geoKey(vehicleType: VehicleType): string {
    return `drivers:available:${vehicleType}`;
  }

  private setRefKey(userId: string): string {
    return `driver:set:${userId}`;
  }

  /** Marks a driver online at a position and indexes them for matching. */
  async goOnline(userId: string, vehicleType: VehicleType, pos: LatLng): Promise<void> {
    const key = this.geoKey(vehicleType);
    await this.redis.geoadd(key, pos.lng, pos.lat, userId);
    await this.redis.set(this.setRefKey(userId), key);
  }

  /** Updates a driver's live position in whichever set they're registered in. */
  async updateLocation(userId: string, pos: LatLng): Promise<boolean> {
    const key = await this.redis.get(this.setRefKey(userId));
    if (!key) return false;
    await this.redis.geoadd(key, pos.lng, pos.lat, userId);
    return true;
  }

  /** Removes a driver from availability (offline or while on a trip). */
  async goOffline(userId: string): Promise<void> {
    const key = await this.redis.get(this.setRefKey(userId));
    if (key) {
      await this.redis.zrem(key, userId);
    }
    await this.redis.del(this.setRefKey(userId));
  }

  /** Returns nearby available drivers ordered by distance (closest first). */
  async findNearby(
    vehicleType: VehicleType,
    pos: LatLng,
    radiusM: number,
    count = 5,
  ): Promise<NearbyDriver[]> {
    const key = this.geoKey(vehicleType);
    // GEOSEARCH key FROMLONLAT lng lat BYRADIUS r m ASC COUNT n WITHCOORD WITHDIST
    const rows = (await this.redis.geosearch(
      key,
      'FROMLONLAT',
      pos.lng,
      pos.lat,
      'BYRADIUS',
      radiusM,
      'm',
      'ASC',
      'COUNT',
      count,
      'WITHCOORD',
      'WITHDIST',
    )) as [string, string, [string, string]][];

    return rows.map((row) => ({
      userId: row[0],
      distanceM: parseFloat(row[1]),
      lng: parseFloat(row[2][0]),
      lat: parseFloat(row[2][1]),
    }));
  }

  async getPosition(userId: string): Promise<LatLng | null> {
    const key = await this.redis.get(this.setRefKey(userId));
    if (!key) return null;
    const res = await this.redis.geopos(key, userId);
    const p = res?.[0];
    if (!p) return null;
    return { lng: parseFloat(p[0]), lat: parseFloat(p[1]) };
  }
}
