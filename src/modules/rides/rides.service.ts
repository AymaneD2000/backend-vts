import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { haversineMeters } from '../../common/geo';
import { ServiceType } from '../../common/service-type';
import { TrustLevel } from '../../common/trust-level';
import { DriversService } from '../drivers/drivers.service';
import { MatchingService } from '../matching/matching.service';
import { PricingService } from '../pricing/pricing.service';
import { RoutingService } from '../routing/routing.service';
import { TrustService } from '../trust/trust.service';
import { RequestRideDto } from './dto/request-ride.dto';
import { CancelRideDto } from './dto/cancel-ride.dto';
import {
  CancelledBy,
  PaymentMethod,
  PaymentStatus,
  Ride,
  RideStatus,
} from './entities/ride.entity';
import {
  DRIVER_ONLINE,
  DriverOnlineEvent,
  RIDE_OFFERED,
  RIDE_TAKEN,
  RIDE_UPDATED,
} from './ride-events';

const ACTIVE_STATUSES = [
  RideStatus.REQUESTED,
  RideStatus.ACCEPTED,
  RideStatus.IN_PROGRESS,
];

// How far around their position a newly-online driver is offered pending rides.
const DISPATCH_RADIUS_M = 5000;

@Injectable()
export class RidesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RidesService.name);
  private scheduledDispatchTimer?: NodeJS.Timeout;

  constructor(
    @InjectRepository(Ride) private readonly rides: Repository<Ride>,
    private readonly pricing: PricingService,
    private readonly matching: MatchingService,
    private readonly drivers: DriversService,
    private readonly routing: RoutingService,
    private readonly trust: TrustService,
    private readonly events: EventEmitter2,
  ) {}

  onModuleInit(): void {
    this.scheduledDispatchTimer = setInterval(() => {
      this.runScheduledDispatch();
    }, 30_000);
    this.scheduledDispatchTimer.unref();
    this.runScheduledDispatch();
  }

  onModuleDestroy(): void {
    if (this.scheduledDispatchTimer) clearInterval(this.scheduledDispatchTimer);
  }

  private runScheduledDispatch(): void {
    void this.dispatchDueScheduled().catch((error: unknown) => {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.error('Scheduled delivery dispatch failed', trace);
    });
  }

  private emit(ride: Ride): void {
    this.events.emit(RIDE_UPDATED, { ride });
  }

  // Broadcast a pending ride to a set of nearby drivers so any of them can
  // claim it. The first to accept wins (see accept()).
  private offerToDrivers(ride: Ride, driverIds: string[]): void {
    if (driverIds.length === 0) return;
    this.events.emit(RIDE_OFFERED, { ride, driverIds });
  }

  // Tell drivers an offer is gone (claimed by someone else, or cancelled).
  private withdrawOffer(rideId: string, driverIds: string[]): void {
    if (driverIds.length === 0) return;
    this.events.emit(RIDE_TAKEN, { rideId, driverIds });
  }

  async request(
    clientId: string,
    dto: RequestRideDto,
    extra?: {
      merchantId?: string;
      scheduledAt?: Date;
      recipientName?: string;
      recipientPhone?: string;
      parcelDescription?: string;
    },
  ): Promise<Ride> {
    const pickup = { lat: dto.pickup.lat, lng: dto.pickup.lng };
    const dropoff = { lat: dto.dropoff.lat, lng: dto.dropoff.lng };

    // Price on the real road distance/duration (OSRM), falling back to the
    // straight-line estimate if the router is unavailable.
    const { distanceM, durationS } = await this.routing.route(pickup, dropoff);
    const quote = this.pricing.quote(dto.serviceType, distanceM, durationS);

    // For parcels, the declared value determines the minimum trust level a
    // driver must have to be offered the job.
    const isParcel = dto.serviceType === ServiceType.PARCEL;
    const requiredTrustLevel = isParcel
      ? await this.trust.getRequiredTrustLevel(dto.declaredValue!)
      : undefined;
    const now = new Date();
    const scheduledAt = extra?.scheduledAt;
    if (scheduledAt && scheduledAt.getTime() <= now.getTime()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    // Pending dispatch: the ride stays unassigned and is broadcast to nearby
    // drivers. It also remains claimable by any driver who comes online later,
    // so requesting before a driver is available no longer dead-ends.
    const ride = this.rides.create({
      serviceType: dto.serviceType,
      status: RideStatus.REQUESTED,
      clientId,
      driverId: undefined,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      pickupAddress: dto.pickup.address,
      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
      dropoffAddress: dto.dropoff.address,
      distanceM: quote.distanceM,
      durationS: quote.durationS,
      fareAmount: quote.amount,
      currency: quote.currency,
      paymentMethod: dto.paymentMethod ?? PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PENDING,
      declaredValue: isParcel ? dto.declaredValue : undefined,
      parcelDescription: isParcel
        ? dto.parcelDescription
        : extra?.parcelDescription,
      recipientName: isParcel ? dto.recipientName : extra?.recipientName,
      recipientPhone: isParcel ? dto.recipientPhone : extra?.recipientPhone,
      parcelSize: isParcel ? dto.parcelSize : undefined,
      requiredTrustLevel,
      merchantId: extra?.merchantId,
      scheduledAt,
      dispatchedAt: scheduledAt ? undefined : now,
    });

    const saved = await this.rides.save(ride);
    this.emit(saved);

    if (!scheduledAt) await this.offerRide(saved);
    return saved;
  }

  private async offerRide(ride: Ride): Promise<void> {
    const candidates = await this.matching.findCandidates(ride.serviceType, {
      lat: ride.pickupLat,
      lng: ride.pickupLng,
    });
    const offered = await this.eligibleDriverIds(
      candidates.map((c) => c.userId),
      ride.requiredTrustLevel ?? undefined,
    );
    this.offerToDrivers(ride, offered);
  }

  private async dispatchDueScheduled(): Promise<void> {
    const due = await this.rides.find({
      where: {
        status: RideStatus.REQUESTED,
        scheduledAt: LessThanOrEqual(new Date()),
        dispatchedAt: IsNull(),
      },
      order: { scheduledAt: 'ASC' },
      take: 50,
    });
    for (const ride of due) {
      await this.claimAndDispatchScheduled(ride);
    }
  }

  async dispatchScheduled(rideId: string): Promise<Ride> {
    const ride = await this.getOrThrow(rideId);
    if (!ride.merchantId || !ride.scheduledAt) {
      throw new BadRequestException('Delivery is not scheduled');
    }
    if (ride.status !== RideStatus.REQUESTED || ride.driverId) {
      throw new BadRequestException(`Cannot dispatch a ${ride.status} delivery`);
    }
    if (ride.dispatchedAt) {
      throw new ConflictException('Delivery has already been dispatched');
    }
    return this.claimAndDispatchScheduled(ride);
  }

  private async claimAndDispatchScheduled(ride: Ride): Promise<Ride> {
    const dispatchedAt = new Date();
    const result = await this.rides.update(
      {
        id: ride.id,
        status: RideStatus.REQUESTED,
        dispatchedAt: IsNull(),
      },
      { dispatchedAt },
    );
    if (result.affected === 0) return this.getOrThrow(ride.id);
    const dispatched = await this.getOrThrow(ride.id);
    this.emit(dispatched);
    await this.offerRide(dispatched);
    return dispatched;
  }

  // Restrict a set of candidate drivers to those meeting a parcel's required
  // trust level. Non-parcel rides (no requirement) pass through unchanged.
  private eligibleDriverIds(
    driverIds: string[],
    requiredTrustLevel?: TrustLevel,
  ): Promise<string[]> {
    if (requiredTrustLevel === undefined) {
      return Promise.resolve(driverIds);
    }
    return this.trust.filterByTrustLevel(driverIds, requiredTrustLevel);
  }

  async accept(rideId: string, driverId: string): Promise<Ride> {
    // Trust gate: a driver may only claim a parcel they are trusted enough to
    // carry. Checked before the atomic claim so an under-trusted driver can't
    // race to win the ride.
    const pending = await this.rides.findOne({ where: { id: rideId } });
    if (!pending) throw new NotFoundException('Ride not found');
    if (pending.scheduledAt && !pending.dispatchedAt) {
      throw new ConflictException('Ride is not available yet');
    }
    if (
      pending.requiredTrustLevel !== null &&
      pending.requiredTrustLevel !== undefined &&
      pending.requiredTrustLevel > TrustLevel.NONE
    ) {
      const allowed = await this.trust.filterByTrustLevel(
        [driverId],
        pending.requiredTrustLevel,
      );
      if (allowed.length === 0) {
        throw new ForbiddenException(
          'Trust level too low to carry this parcel',
        );
      }
    }

    // Atomic claim: only one driver can flip a still-pending ride to accepted.
    // The conditional UPDATE means concurrent accepts race at the database and
    // exactly one wins.
    const result = await this.rides.update(
      { id: rideId, status: RideStatus.REQUESTED, driverId: IsNull() },
      {
        status: RideStatus.ACCEPTED,
        driverId,
        acceptedAt: new Date(),
      },
    );
    if (result.affected === 0) {
      const existing = await this.rides.findOne({ where: { id: rideId } });
      if (!existing) throw new NotFoundException('Ride not found');
      throw new ConflictException('Ride is no longer available');
    }

    const ride = await this.getOrThrow(rideId);
    // Reserve the driver: remove from the available pool while on the trip.
    await this.drivers.goOffline(driverId);
    this.emit(ride);

    // Pull the offer from every other nearby driver.
    const others = await this.matching.findCandidates(ride.serviceType, {
      lat: ride.pickupLat,
      lng: ride.pickupLng,
    });
    this.withdrawOffer(
      ride.id,
      others.map((c) => c.userId).filter((id) => id !== driverId),
    );
    return ride;
  }

  // When a driver comes online, offer them any pending rides nearby that match
  // their vehicle class. This closes the gap where a client requested before
  // any driver was available.
  @OnEvent(DRIVER_ONLINE)
  async handleDriverOnline(event: DriverOnlineEvent): Promise<void> {
    const pending = await this.rides.find({
      where: { status: RideStatus.REQUESTED, driverId: IsNull() },
      order: { createdAt: 'ASC' },
      take: 20,
    });
    const pos = { lat: event.lat, lng: event.lng };
    for (const ride of pending) {
      if (ride.scheduledAt && !ride.dispatchedAt) continue;
      if (this.matching.vehicleTypeFor(ride.serviceType) !== event.vehicleType) {
        continue;
      }
      const d = haversineMeters(pos, {
        lat: ride.pickupLat,
        lng: ride.pickupLng,
      });
      if (d > DISPATCH_RADIUS_M) continue;
      const offered = await this.eligibleDriverIds(
        [event.driverId],
        ride.requiredTrustLevel ?? undefined,
      );
      if (offered.length === 0) continue;
      this.offerToDrivers(ride, offered);
    }
  }

  async start(rideId: string, driverId: string): Promise<Ride> {
    const ride = await this.getOrThrow(rideId);
    this.assertDriver(ride, driverId);
    if (ride.status !== RideStatus.ACCEPTED) {
      throw new BadRequestException(`Cannot start a ${ride.status} ride`);
    }
    ride.status = RideStatus.IN_PROGRESS;
    ride.startedAt = new Date();
    const saved = await this.rides.save(ride);
    this.emit(saved);
    return saved;
  }

  async complete(rideId: string, driverId: string): Promise<Ride> {
    const ride = await this.getOrThrow(rideId);
    this.assertDriver(ride, driverId);
    if (ride.status !== RideStatus.IN_PROGRESS) {
      throw new BadRequestException(`Cannot complete a ${ride.status} ride`);
    }
    ride.status = RideStatus.COMPLETED;
    ride.completedAt = new Date();
    // Cash is settled in person; Mobile Money settlement comes in the
    // payments module. Mark cash as paid on completion.
    if (ride.paymentMethod === PaymentMethod.CASH) {
      ride.paymentStatus = PaymentStatus.PAID;
    }
    const saved = await this.rides.save(ride);
    this.emit(saved);
    return saved;
  }

  async cancel(
    rideId: string,
    userId: string,
    dto: CancelRideDto = {},
  ): Promise<Ride> {
    const ride = await this.getOrThrow(rideId);
    if (ride.clientId !== userId && ride.driverId !== userId) {
      throw new ForbiddenException('Not your ride');
    }
    if (!ACTIVE_STATUSES.includes(ride.status)) {
      throw new BadRequestException(`Cannot cancel a ${ride.status} ride`);
    }
    const wasPending =
      ride.status === RideStatus.REQUESTED &&
      !ride.driverId &&
      (!ride.scheduledAt || !!ride.dispatchedAt);
    ride.status = RideStatus.CANCELLED;
    ride.cancelledAt = new Date();
    ride.cancelledBy =
      ride.clientId === userId ? CancelledBy.CLIENT : CancelledBy.DRIVER;
    ride.cancelReason = dto.reason;
    ride.cancelNote = dto.note;
    const saved = await this.rides.save(ride);
    this.emit(saved);
    // If the ride was still being offered, drop it from nearby drivers' screens.
    if (wasPending) {
      const others = await this.matching.findCandidates(saved.serviceType, {
        lat: saved.pickupLat,
        lng: saved.pickupLng,
      });
      this.withdrawOffer(saved.id, others.map((c) => c.userId));
    }
    return saved;
  }

  async get(rideId: string, userId: string): Promise<Ride> {
    const ride = await this.getOrThrow(rideId);
    if (ride.clientId !== userId && ride.driverId !== userId) {
      throw new ForbiddenException('Not your ride');
    }
    return ride;
  }

  list(userId: string): Promise<Ride[]> {
    return this.rides.find({
      where: [{ clientId: userId }, { driverId: userId }],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // All rides dispatched by a set of merchants (newest first). Used by the
  // merchant space to list a shop's deliveries.
  findByMerchantIds(merchantIds: string[]): Promise<Ride[]> {
    if (merchantIds.length === 0) return Promise.resolve([]);
    return this.rides.find({
      where: { merchantId: In(merchantIds) },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findMerchantDelivery(rideId: string): Promise<Ride> {
    const ride = await this.rides.findOne({
      where: { id: rideId, serviceType: ServiceType.MERCHANT_DELIVERY },
    });
    if (!ride?.merchantId) throw new NotFoundException('Delivery not found');
    return ride;
  }

  getActiveRideForDriver(driverId: string): Promise<Ride | null> {
    return this.rides.findOne({
      where: { driverId, status: In(ACTIVE_STATUSES) },
      order: { createdAt: 'DESC' },
    });
  }

  private assertDriver(ride: Ride, driverId: string): void {
    if (ride.driverId !== driverId) {
      throw new ForbiddenException('Not the assigned driver');
    }
  }

  private async getOrThrow(rideId: string): Promise<Ride> {
    const ride = await this.rides.findOne({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');
    return ride;
  }
}
