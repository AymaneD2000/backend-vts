import { ServiceType } from '../../common/service-type';
import { RideTier } from '../rides/entities/ride.entity';
import { PricingService } from './pricing.service';

describe('PricingService persisted quotes', () => {
  it('requires a tier for car quotes and selects the highest matching zone', async () => {
    const cards = {
      findOne: jest.fn().mockResolvedValue({ id: 'card-1', serviceType: ServiceType.RIDE_CAR, rideTier: RideTier.ECO, baseAmount: 500, perKmAmount: 250, perMinuteAmount: 25, minimumAmount: 1000, averageSpeedKmh: 25 }),
    };
    const zones = {
      find: jest.fn().mockResolvedValue([
        { id: 'z1', name: 'A', centerLat: 12.6, centerLng: -8, radiusM: 5000, multiplier: 1.2, enabled: true, startsAt: new Date('2026-01-01') },
        { id: 'z2', name: 'B', centerLat: 12.6, centerLng: -8, radiusM: 5000, multiplier: 1.5, enabled: true, startsAt: new Date('2026-01-01') },
      ]),
    };
    const service = new PricingService(cards as any, zones as any);
    await expect(service.quote({ serviceType: ServiceType.RIDE_CAR, pickup: { lat: 12.6, lng: -8 }, distanceM: 10000, durationS: 1200 } as any)).rejects.toThrow();
    const quote = await service.quote({ serviceType: ServiceType.RIDE_CAR, rideTier: RideTier.ECO, pickup: { lat: 12.6, lng: -8 }, distanceM: 10000, durationS: 1200 } as any);
    expect(quote.rateCardId).toBe('card-1');
    expect(quote.surgeMultiplier).toBe(1.5);
    expect(quote.demandZone?.id).toBe('z2');
  });
});
