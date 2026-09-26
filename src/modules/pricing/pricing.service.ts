import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationError, ApplicationErrorCode } from '../../common/application-error';
import { haversineMeters, LatLng } from '../../common/geo';
import { ServiceType } from '../../common/service-type';
import { RideTier } from '../rides/entities/ride.entity';
import { DemandZone } from './entities/demand-zone.entity';
import { RateCard as PersistedRateCard } from './entities/rate-card.entity';

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

export interface PersistedFareQuote extends FareQuote {
  rideTier: RideTier | null;
  rateCardId: string;
  demandZone: { id: string; name: string } | null;
  surgeMultiplier: number;
  baseAmount: number;
  distanceAmount: number;
  timeAmount: number;
  subtotalAmount: number;
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
  constructor(
    @InjectRepository(PersistedRateCard) private readonly rateCards?: Repository<PersistedRateCard>,
    @InjectRepository(DemandZone) private readonly demandZones?: Repository<DemandZone>,
  ) {}

  getRateCard(serviceType: ServiceType): RateCard {
    return RATE_CARDS[serviceType];
  }

  /** Estimates trip duration (seconds) from distance using the rate card speed. */
  estimateDurationS(serviceType: ServiceType, distanceM: number): number {
    const { avgSpeedKmh } = this.getRateCard(serviceType);
    const hours = distanceM / 1000 / avgSpeedKmh;
    return Math.round(hours * 3600);
  }

  quote(serviceType: ServiceType, distanceM: number, durationS?: number): FareQuote;
  quote(input: { serviceType: ServiceType; rideTier?: RideTier; pickup: LatLng; distanceM: number; durationS?: number; at?: Date }): Promise<PersistedFareQuote>;
  quote(serviceTypeOrInput: ServiceType | { serviceType: ServiceType; rideTier?: RideTier; pickup: LatLng; distanceM: number; durationS?: number; at?: Date }, distanceM?: number, durationS?: number): FareQuote | Promise<PersistedFareQuote> {
    if (typeof serviceTypeOrInput !== 'string') return this.persistedQuote(serviceTypeOrInput);
    const serviceType = serviceTypeOrInput;
    const card = this.getRateCard(serviceType);
    const duration = durationS ?? this.estimateDurationS(serviceType, distanceM!);

    const distanceCost = (distanceM! / 1000) * card.perKm;
    const timeCost = (duration / 60) * card.perMin;
    const raw = card.base + distanceCost + timeCost;
    const amount = Math.max(card.minimum, Math.round(raw / 50) * 50); // round to 50 XOF

    return {
      serviceType,
      currency: 'XOF',
      distanceM: Math.round(distanceM!),
      durationS: duration,
      base: card.base,
      distanceCost: Math.round(distanceCost),
      timeCost: Math.round(timeCost),
      amount,
    };
  }

  private async persistedQuote(input: { serviceType: ServiceType; rideTier?: RideTier; pickup: LatLng; distanceM: number; durationS?: number; at?: Date }): Promise<PersistedFareQuote> {
    if (!this.rateCards || !this.demandZones) return Promise.reject(new Error('Persisted pricing repositories are not configured'));
    if (input.serviceType === ServiceType.RIDE_CAR && !input.rideTier) throw new ApplicationError(HttpStatus.BAD_REQUEST, ApplicationErrorCode.VALIDATION_FAILED, 'Le niveau de course est requis.');
    if (input.serviceType !== ServiceType.RIDE_CAR && input.rideTier) throw new ApplicationError(HttpStatus.BAD_REQUEST, ApplicationErrorCode.VALIDATION_FAILED, 'Le niveau de course est invalide pour ce service.');
    const at = input.at ?? new Date();
    const card = await this.rateCards.findOne({ where: { serviceType: input.serviceType, rideTier: input.rideTier ?? null, enabled: true } as any, order: { effectiveFrom: 'DESC' } });
    if (!card || card.effectiveFrom > at || (card.effectiveUntil && card.effectiveUntil <= at)) throw new ApplicationError(HttpStatus.NOT_FOUND, ApplicationErrorCode.RESOURCE_NOT_FOUND, 'Tarification indisponible.');
    const zones = await this.demandZones.find({ where: { enabled: true } as any });
    const applicable = zones.filter((zone) => zone.startsAt <= at && (!zone.endsAt || zone.endsAt > at) && (!zone.serviceType || zone.serviceType === input.serviceType) && (!zone.rideTier || zone.rideTier === (input.rideTier ?? null)) && haversineMeters(input.pickup, { lat: zone.centerLat, lng: zone.centerLng }) <= zone.radiusM).sort((a, b) => Number(b.multiplier) - Number(a.multiplier));
    const demandZone = applicable[0] ?? null;
    const surgeMultiplier = demandZone ? Number(demandZone.multiplier) : 1;
    const duration = input.durationS ?? Math.round((input.distanceM / 1000 / Number(card.averageSpeedKmh)) * 3600);
    const baseAmount = Number(card.baseAmount);
    const distanceAmount = Math.round((input.distanceM / 1000) * Number(card.perKmAmount));
    const timeAmount = Math.round((duration / 60) * Number(card.perMinuteAmount));
    const subtotalAmount = baseAmount + distanceAmount + timeAmount;
    const amount = Math.max(Number(card.minimumAmount), Math.round((subtotalAmount * surgeMultiplier) / 50) * 50);
    return { serviceType: input.serviceType, rideTier: input.rideTier ?? null, rateCardId: card.id, demandZone: demandZone ? { id: demandZone.id, name: demandZone.name } : null, surgeMultiplier, currency: 'XOF', distanceM: Math.round(input.distanceM), durationS: duration, base: baseAmount, distanceCost: distanceAmount, timeCost: timeAmount, amount, baseAmount, distanceAmount, timeAmount, subtotalAmount };
  }
}
