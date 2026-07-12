import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { ServiceType } from '../../common/service-type';
import { DriversService } from '../drivers/drivers.service';
import { MatchingService } from '../matching/matching.service';
import { PricingService } from '../pricing/pricing.service';
import { RoutingService } from '../routing/routing.service';
import { TrustService } from '../trust/trust.service';
import { VehicleType } from '../users/entities/driver-profile.entity';
import { Ride, RideStatus } from './entities/ride.entity';
import { RidesService } from './rides.service';

describe('RidesService scheduling', () => {
  let rides: jest.Mocked<
    Pick<Repository<Ride>, 'create' | 'save' | 'find' | 'findOne' | 'update'>
  >;
  let matching: jest.Mocked<
    Pick<MatchingService, 'findCandidates' | 'vehicleTypeFor'>
  >;
  let events: jest.Mocked<Pick<EventEmitter2, 'emit'>>;
  let service: RidesService;

  beforeEach(() => {
    rides = {
      create: jest.fn((ride) => ride as Ride),
      save: jest.fn((ride) => Promise.resolve({ id: 'ride-1', ...ride } as Ride)),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    } as any;
    matching = {
      findCandidates: jest.fn().mockResolvedValue([]),
      vehicleTypeFor: jest.fn(),
    } as any;
    events = { emit: jest.fn() } as any;

    const pricing = {
      quote: jest.fn().mockReturnValue({
        distanceM: 1200,
        durationS: 360,
        amount: 1000,
        currency: 'XOF',
      }),
    } as unknown as PricingService;
    const routing = {
      route: jest.fn().mockResolvedValue({ distanceM: 1200, durationS: 360 }),
    } as unknown as RoutingService;
    const trust = {
      getRequiredTrustLevel: jest.fn(),
      filterByTrustLevel: jest.fn(),
    } as unknown as TrustService;
    const drivers = { goOffline: jest.fn() } as unknown as DriversService;

    service = new RidesService(
      rides as any,
      pricing,
      matching as any,
      drivers,
      routing,
      trust,
      events as any,
    );
  });

  it('stores a future merchant delivery without offering it to drivers', async () => {
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000);

    const ride = await service.request(
      'merchant-user',
      {
        serviceType: ServiceType.MERCHANT_DELIVERY,
        pickup: { lat: 12.64, lng: -8.0 },
        dropoff: { lat: 12.62, lng: -7.98 },
      },
      {
        merchantId: 'merchant-1',
        scheduledAt,
        recipientName: 'Awa',
        recipientPhone: '70000000',
      },
    );

    expect(ride.scheduledAt).toEqual(scheduledAt);
    expect(ride.dispatchedAt).toBeUndefined();
    expect(ride.recipientName).toBe('Awa');
    expect(matching.findCandidates).not.toHaveBeenCalled();
  });

  it('does not offer an undispatched planned delivery to a newly-online driver', async () => {
    rides.find.mockResolvedValue([
      {
        id: 'ride-1',
        status: RideStatus.REQUESTED,
        serviceType: ServiceType.MERCHANT_DELIVERY,
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
        dispatchedAt: undefined,
      } as Ride,
    ]);

    await service.handleDriverOnline({
      driverId: 'driver-1',
      vehicleType: VehicleType.MOTO,
      lat: 12.64,
      lng: -8.0,
    });

    expect(matching.vehicleTypeFor).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });
});
