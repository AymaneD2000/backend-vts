import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { DriversService } from '../drivers/drivers.service';
import { MatchingService } from '../matching/matching.service';
import { PricingService } from '../pricing/pricing.service';
import { RoutingService } from '../routing/routing.service';
import { TrustService } from '../trust/trust.service';
import { RequestRideDto } from './dto/request-ride.dto';
import { CancelRideDto } from './dto/cancel-ride.dto';
import { Ride } from './entities/ride.entity';
import { DriverOnlineEvent } from './ride-events';
export declare class RidesService {
    private readonly rides;
    private readonly pricing;
    private readonly matching;
    private readonly drivers;
    private readonly routing;
    private readonly trust;
    private readonly events;
    constructor(rides: Repository<Ride>, pricing: PricingService, matching: MatchingService, drivers: DriversService, routing: RoutingService, trust: TrustService, events: EventEmitter2);
    private emit;
    private offerToDrivers;
    private withdrawOffer;
    request(clientId: string, dto: RequestRideDto, extra?: {
        merchantId?: string;
    }): Promise<Ride>;
    private eligibleDriverIds;
    accept(rideId: string, driverId: string): Promise<Ride>;
    handleDriverOnline(event: DriverOnlineEvent): Promise<void>;
    start(rideId: string, driverId: string): Promise<Ride>;
    complete(rideId: string, driverId: string): Promise<Ride>;
    cancel(rideId: string, userId: string, dto?: CancelRideDto): Promise<Ride>;
    get(rideId: string, userId: string): Promise<Ride>;
    list(userId: string): Promise<Ride[]>;
    findByMerchantIds(merchantIds: string[]): Promise<Ride[]>;
    getActiveRideForDriver(driverId: string): Promise<Ride | null>;
    private assertDriver;
    private getOrThrow;
}
