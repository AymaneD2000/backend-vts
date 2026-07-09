import { ServiceType } from '../../common/service-type';
import { PricingService } from './pricing.service';

describe('PricingService', () => {
  const service = new PricingService();

  it('estimates duration from distance using the rate card speed', () => {
    // 25 km at 25 km/h => 1 hour => 3600s
    expect(service.estimateDurationS(ServiceType.RIDE_CAR, 25_000)).toBe(3600);
  });

  it('applies base + distance + time and rounds to 50 XOF', () => {
    const quote = service.quote(ServiceType.RIDE_CAR, 10_000, 1200);
    // base 500 + 10km*250 (2500) + 20min*25 (500) = 3500
    expect(quote.amount).toBe(3500);
    expect(quote.currency).toBe('XOF');
    expect(quote.distanceCost).toBe(2500);
    expect(quote.timeCost).toBe(500);
  });

  it('never charges below the service minimum', () => {
    const quote = service.quote(ServiceType.MOTO, 100, 10);
    expect(quote.amount).toBe(500); // moto minimum
  });

  it('estimates duration when none is provided', () => {
    const quote = service.quote(ServiceType.PARCEL, 12_500);
    // 12.5km at 25km/h => 0.5h => 1800s
    expect(quote.durationS).toBe(1800);
  });
});
