import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LatLng } from '../../common/geo';
import { Rating } from '../ratings/entities/rating.entity';
import { DRIVER_ONLINE } from '../rides/ride-events';
import { Ride, RideStatus } from '../rides/entities/ride.entity';
import {
  DriverProfile,
  KycStatus,
} from '../users/entities/driver-profile.entity';
import { UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { DriverPresenceService } from './driver-presence.service';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(DriverProfile)
    private readonly profiles: Repository<DriverProfile>,
    @InjectRepository(Ride)
    private readonly rides: Repository<Ride>,
    @InjectRepository(Rating)
    private readonly ratings: Repository<Rating>,
    private readonly presence: DriverPresenceService,
    private readonly users: UsersService,
    private readonly events: EventEmitter2,
  ) {}

  // Aggregated stats for the driver dashboard: today's completed trips, the
  // fares they earned today and their overall average rating.
  async summary(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayStats = await this.rides
      .createQueryBuilder('ride')
      .select('COUNT(ride.id)', 'count')
      .addSelect('COALESCE(SUM(ride.fare_amount), 0)', 'earnings')
      .where('ride.driver_id = :userId', { userId })
      .andWhere('ride.status = :status', { status: RideStatus.COMPLETED })
      .andWhere('ride.completed_at >= :startOfDay', { startOfDay })
      .getRawOne<{ count: string; earnings: string }>();

    const ratingStats = await this.ratings
      .createQueryBuilder('rating')
      .select('AVG(rating.score)', 'average')
      .addSelect('COUNT(rating.id)', 'count')
      .where('rating.ratee_id = :userId', { userId })
      .getRawOne<{ average: string | null; count: string }>();

    const ratingCount = Number(ratingStats?.count ?? 0);
    const average = ratingStats?.average
      ? Number(ratingStats.average)
      : null;

    return {
      todayRides: Number(todayStats?.count ?? 0),
      todayEarnings: Number(todayStats?.earnings ?? 0),
      currency: 'XOF',
      rating: average === null ? null : Math.round(average * 10) / 10,
      ratingCount,
    };
  }

  async getOrCreateProfile(userId: string): Promise<DriverProfile> {
    let profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profiles.create({ userId });
      profile = await this.profiles.save(profile);
    }
    return profile;
  }

  async status(userId: string) {
    const profile = await this.profiles.findOne({ where: { userId } });
    const ready = Boolean(
      profile?.kycStatus === KycStatus.APPROVED &&
        this.hasCompleteVehicleProfile(profile),
    );
    const isAvailable = ready && Boolean(profile?.isAvailable);

    return {
      ready,
      isAvailable,
      canReceiveRides: ready && isAvailable,
      kycStatus: profile?.kycStatus ?? KycStatus.PENDING,
      vehicleType: profile?.vehicleType ?? null,
      vehiclePlate: profile?.vehiclePlate ?? null,
      vehicleMake: profile?.vehicleMake ?? null,
      vehicleModel: profile?.vehicleModel ?? null,
      vehicleColor: profile?.vehicleColor ?? null,
      vehicleYear: profile?.vehicleYear ?? null,
    };
  }

  async goOnline(userId: string, pos: LatLng): Promise<DriverProfile> {
    const profile = await this.getOrCreateProfile(userId);
    if (profile.kycStatus !== KycStatus.APPROVED) {
      throw new BadRequestException(
        'KYC verification required before going online',
      );
    }
    const vehicleType = profile.vehicleType;
    if (!vehicleType || !this.hasCompleteVehicleProfile(profile)) {
      throw new BadRequestException(
        'Complete driver onboarding before going online',
      );
    }
    profile.isAvailable = true;
    profile.lastLat = pos.lat;
    profile.lastLng = pos.lng;
    await this.profiles.save(profile);
    // Backfill the driver role for approved drivers whose user record was
    // never updated (e.g. approved directly in the DB rather than via admin).
    const user = await this.users.findById(userId);
    if (user) await this.users.addRole(user, UserRole.DRIVER);
    await this.presence.goOnline(userId, vehicleType, pos);
    // Let the dispatcher offer this driver any pending rides nearby.
    this.events.emit(DRIVER_ONLINE, {
      driverId: userId,
      vehicleType,
      lat: pos.lat,
      lng: pos.lng,
    });
    return profile;
  }

  async goOffline(userId: string): Promise<void> {
    await this.presence.goOffline(userId);
    await this.profiles.update({ userId }, { isAvailable: false });
  }

  async updateLocation(userId: string, pos: LatLng): Promise<void> {
    const ok = await this.presence.updateLocation(userId, pos);
    if (!ok) {
      throw new BadRequestException('Driver is offline; go online first');
    }
    await this.profiles.update(
      { userId },
      { lastLat: pos.lat, lastLng: pos.lng },
    );
  }

  private hasCompleteVehicleProfile(profile: DriverProfile): boolean {
    return Boolean(
      profile.vehicleType &&
        profile.vehiclePlate?.trim() &&
        profile.vehicleMake?.trim() &&
        profile.vehicleModel?.trim() &&
        profile.vehicleColor?.trim(),
    );
  }
}
