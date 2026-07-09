import { ServiceType } from '../../../common/service-type';
declare class PointDto {
    lat: number;
    lng: number;
}
export declare class QuoteDto {
    serviceType: ServiceType;
    pickup: PointDto;
    dropoff: PointDto;
}
export {};
