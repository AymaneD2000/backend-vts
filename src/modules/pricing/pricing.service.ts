import { Injectable } from '@nestjs/common';
import { ServiceType } from '../../common/service-type';

export interface RateCard {
  // All monetary values in XOF (Franc CFA), the currency in Mali.
  base: number; // pickup / flag-fall fee
  perKm: number;
  perMin: number;
  minimum: number; // minimum total fare
  avgSpeedKmh: number; // used to estimate duration from distance
}

export interface FareQuote {
  serviceType: ServiceType;
  currency: 'XOF';
  distanceM: number;
  durationS: number;
  base: number;
  distanceCost: number;
  timeCost: number;
  amount: number;
}

// Default rate cards per service. These are placeholders to be tuned with
// real market data (and later, dynamic pricing in Phase 2).
const RATE_CARDS: Record<ServiceType, RateCard> = {
  [ServiceType.RIDE_CAR]: {
    base: 500,
    perKm: 250,
    perMin: 25,
    minimum: 1000,
    avgSpeedKmh: 25,
  },
  [ServiceType.MOTO]: {
    base: 250,
    perKm: 150,
    perMin: 15,
    minimum: 500,
    avgSpeedKmh: 30,
  },
  [ServiceType.PARCEL]: {
    base: 500,
    perKm: 200,
    perMin: 10,
    minimum: 750,
    avgSpeedKmh: 25,
  },
  // Fast moto-based delivery from a shop to a customer.
  [ServiceType.MERCHANT_DELIVERY]: {
    base: 300,
    perKm: 175,
    perMin: 12,
    minimum: 600,
    avgSpeedKmh: 30,
  },
};

@Injectable()
export class PricingService {
  getRateCard(serviceType: ServiceType): RateCard {
    return RATE_CARDS[serviceType];
  }

  /** Estimates trip duration (seconds) from distance using the rate card speed. */
  estimateDurationS(serviceType: ServiceType, distanceM: number): number {
    const { avgSpeedKmh } = this.getRateCard(serviceType);
    const hours = distanceM / 1000 / avgSpeedKmh;
    return Math.round(hours * 3600);
  }

  quote(
    serviceType: ServiceType,
    distanceM: number,
    durationS?: number,
  ): FareQuote {
    const card = this.getRateCard(serviceType);
    const duration = durationS ?? this.estimateDurationS(serviceType, distanceM);

    const distanceCost = (distanceM / 1000) * card.perKm;
    const timeCost = (duration / 60) * card.perMin;
    const raw = card.base + distanceCost + timeCost;
    const amount = Math.max(card.minimum, Math.round(raw / 50) * 50); // round to 50 XOF

    return {
      serviceType,
      currency: 'XOF',
      distanceM: Math.round(distanceM),
      durationS: duration,
      base: card.base,
      distanceCost: Math.round(distanceCost),
      timeCost: Math.round(timeCost),
      amount,
    };
  }
}
