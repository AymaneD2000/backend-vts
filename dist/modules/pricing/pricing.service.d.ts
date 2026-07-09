import { ServiceType } from '../../common/service-type';
export interface RateCard {
    base: number;
    perKm: number;
    perMin: number;
    minimum: number;
    avgSpeedKmh: number;
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
export declare class PricingService {
    getRateCard(serviceType: ServiceType): RateCard;
    estimateDurationS(serviceType: ServiceType, distanceM: number): number;
    quote(serviceType: ServiceType, distanceM: number, durationS?: number): FareQuote;
}
